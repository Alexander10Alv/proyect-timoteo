import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import P from 'pino';
import QRCode from 'qrcode';

const logger = P({ level: process.env.LOG_LEVEL || 'silent' });

/**
 * WhatsAppBot — envoltura de Baileys v7 con los patches documentados:
 *  - LID routing para evitar el ERROR 463 (issue #2683)
 *  - Reconexión automática (salvo loggedOut), cubre restartRequired del QR
 *  - QR en vivo (printQRInTerminal está deprecado) como data-URL
 *  - Pairing code SOLO cuando el socket está listo (issue #1382/#1562)
 *  - getMessage para que los retries de WhatsApp no atasquen mensajes
 */
export class WhatsAppBot {
  constructor({ authDir }) {
    this.authDir = authDir;
    this.sock = null;
    this.connection = 'connecting';
    this.user = null;
    this.lastQr = null;
    this.qrDataUrl = null;
    this.pairingReady = false;
    this.lastDisconnectError = null;
    this.starting = false;
  }

  async start() {
    if (this.starting) return;
    this.starting = true;
    try {
      const { state, saveCreds } = await useMultiFileAuthState(this.authDir);

      const sock = makeWASocket({
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        logger,
        // Necesario para el sistema de retries (evita "este mensaje puede tardar")
        getMessage: async () => ({}),
      });

      this.sock = sock;

      // Persistir la sesión siempre que cambien credenciales
      sock.ev.on('creds.update', saveCreds);

      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.lastQr = qr;
          this.pairingReady = true; // con el QR emitido ya se puede pedir pairing code
          try {
            this.qrDataUrl = await QRCode.toDataURL(qr, { margin: 1 });
          } catch {
            this.qrDataUrl = null;
          }
        }

        if (!connection) return;
        this.connection = connection;

        if (connection === 'open') {
          this.lastQr = null;
          this.qrDataUrl = null;
          this.pairingReady = false;
          this.user = sock.user ?? null;
          logger.info('Conectado a WhatsApp');
        }

        if (connection === 'close') {
          this.lastDisconnectError = lastDisconnect?.error ?? null;
          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

          if (shouldReconnect) {
            logger.info('Conexión cerrada, reconectando…');
            this.starting = false;
            setTimeout(() => this.start(), 2500);
          } else {
            logger.info('Sesión revocada (loggedOut). Borra la carpeta de sesión y re-vincula.');
            this.user = null;
            this.starting = false;
          }
        }
      });
    } catch (err) {
      logger.error({ err }, 'Error al iniciar el socket');
      this.starting = false;
    }
  }

  /** JID canónico para enviar: PN -> LID si hay mapping (patch ERROR 463). */
  async _canonicalJid(pnJid) {
    try {
      const mapping = this.sock?.signalRepository?.lidMapping;
      if (mapping && typeof mapping.getLIDForPN === 'function') {
        const lid = await mapping.getLIDForPN(pnJid);
        if (lid) return lid;
      }
    } catch {
      // sin mapping -> se usa el PN
    }
    return pnJid;
  }

  async requestPairing(phone) {
    const sock = this.sock;
    if (!sock) throw new Error('El bot no está iniciado.');

    if (sock.authState?.creds?.registered) {
      return { alreadyRegistered: true, phone: this.user?.id ?? null };
    }

    if (!this.pairingReady) {
      throw new Error(
        `Aún no se puede pedir el código: espera a que el bot genere el QR (estado: ${this.connection}).`
      );
    }

    const digits = String(phone).replace(/\D/g, '');
    if (!/^\d{8,15}$/.test(digits)) {
      throw new Error('Teléfono inválido: usa solo dígitos con código de país (ej. 51960906717).');
    }

    const code = await sock.requestPairingCode(digits);
    return { code: code.match(/.{1,4}/g)?.join('-') ?? code };
  }

  async send(phone, message, media = []) {
    const sock = this.sock;
    if (!sock) throw new Error('El bot no está iniciado.');
    if (this.connection !== 'open') {
      throw new Error(`El bot no está conectado a WhatsApp (estado: ${this.connection}).`);
    }

    const digits = String(phone).replace(/\D/g, '');
    if (!/^\d{8,15}$/.test(digits)) {
      throw new Error('Teléfono inválido: usa solo dígitos con código de país.');
    }

    const jid = await this._canonicalJid(`${digits}@s.whatsapp.net`);

    const cleanMedia = (media || []).map((m) => ({
      name: String(m.name ?? '').trim() || 'adjunto',
      mimeType: String(m.mimeType ?? 'application/octet-stream'),
      data: Buffer.from(String(m.dataUrl).split(',')[1] ?? '', 'base64'),
    }));

    if (cleanMedia.length === 0) {
      await sock.sendMessage(jid, { text: String(message) });
      return { jid };
    }

    await sock.sendMessage(jid, { text: String(message) });

    for (const m of cleanMedia) {
      const isImage = /^image\//.test(m.mimeType);
      if (isImage) {
        await sock.sendMessage(jid, { image: m.data, mimetype: m.mimeType, caption: m.name });
      } else {
        await sock.sendMessage(jid, {
          document: m.data,
          mimetype: m.mimeType,
          fileName: m.name,
          caption: '',
        });
      }
    }
    return { jid, mediaSent: cleanMedia.length };
  }

  async logout() {
    const sock = this.sock;
    if (sock) {
      try {
        await sock.logout();
      } catch {
        // si la sesión ya estaba caída, seguimos y borramos
      }
    }
    const fs = await import('node:fs');
    fs.rmSync(this.authDir, { recursive: true, force: true });

    this.lastQr = null;
    this.qrDataUrl = null;
    this.pairingReady = false;
    this.user = null;
    this.connection = 'closed';
    this.starting = false;

    await this.start();
  }

  get status() {
    return {
      connection: this.connection,
      registered: Boolean(this.sock?.authState?.creds?.registered),
      phone: this.user?.id ?? this.sock?.authState?.creds?.me?.id ?? null,
      hasQr: Boolean(this.qrDataUrl),
      pairingReady: this.pairingReady,
      lastDisconnect:
        this.lastDisconnectError instanceof Error
          ? this.lastDisconnectError.message
          : String(this.lastDisconnectError ?? ''),
    };
  }
}