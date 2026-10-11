import 'dotenv/config';
import express from 'express';
import { WhatsAppBot } from './socket.js';

const PORT = Number(process.env.PORT || 3030);
const HOST = process.env.HOST || '127.0.0.1';
const BOT_TOKEN = process.env.BOT_TOKEN || '';
const AUTH_DIR = process.env.AUTH_DIR || './auth_info_baileys';

const bot = new WhatsAppBot({ authDir: AUTH_DIR });
bot.start();

const app = express();
app.use(express.json({ limit: '50mb' }));

function requireToken(req, res, next) {
  const token = req.get('x-bot-token') || req.query.token;
  if (!BOT_TOKEN || token === BOT_TOKEN) return next();
  return res.status(401).json({ error: 'Token inválido' });
}

app.get('/status', requireToken, (_req, res) => {
  res.json(bot.status);
});

// Panel visual simple para vincular el número y ver el estado.
app.get('/', (_req, res) => {
  const token = BOT_TOKEN ? `?token=${encodeURIComponent(BOT_TOKEN)}` : '';
  res.type('html').send(`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>whatsapp-bot · Proyecto Timoteo</title>
<style>
  body{font-family:system-ui,sans-serif;background:#f4f7fc;margin:0;padding:24px;color:#1f2b45}
  main{max-width:480px;margin:0 auto}
  h1{font-size:20px} h1 small{display:block;font-weight:400;font-size:13px;color:#6e7c99}
  .card{background:#fff;border:1px solid #dbe3f2;border-radius:12px;padding:18px;margin-top:14px}
  .row{display:flex;justify-content:space-between;font-size:14px;margin:6px 0}
  .badge{padding:2px 8px;border-radius:999px;font-size:12px;font-weight:600}
  .ok{background:#d1fae5;color:#065f46}.warn{background:#fef3c7;color:#92400e}
  #qrWrap{text-align:center} #qrWrap img{width:230px;height:230px;image-rendering:pixelated}
  .hide{display:none}
  input{width:100%;padding:10px;border:1px solid #c2cde3;border-radius:8px;box-sizing:border-box;margin:8px 0}
  button{width:100%;padding:10px;border:0;border-radius:8px;background:#1e40af;color:#fff;font-weight:600;cursor:pointer}
  button:disabled{opacity:.5}
  .hint{font-size:13px;color:#6e7c99}
</style>
</head>
<body>
<main>
  <h1>Bot de WhatsApp <small>Proyecto Timoteo · vincula tu número escaneando el QR</small></h1>
  <div class="card">
    <div class="row"><span>Estado</span><span id="conn" class="badge warn">…</span></div>
    <div class="row"><span>Número vinculado</span><span id="phone">—</span></div>
  </div>
  <div class="card" id="qrCard">
    <div id="qrWrap"><p class="hint">Cargando QR…</p></div>
    <p class="hint">Escanea con: WhatsApp → Ajustes → Dispositivos vinculados → Vincular un dispositivo</p>
  </div>
  <div class="card">
    <p style="margin:0 0 4px;font-weight:600;font-size:14px">¿No puedes escanear? Usa el código de vinculación</p>
    <input id="phoneInput" placeholder="Tu número, solo dígitos con código de país (ej. 51960906717)" />
    <button id="pairBtn">Pedir código de vinculación</button>
    <p id="pairMsg" class="hint"></p>
  </div>
  <script>
    const Q = '${token}';
    async function refresh() {
      try {
        const s = await (await fetch('/status' + Q)).json();
        document.getElementById('conn').textContent =
          s.connection === 'open' ? 'Conectado' : s.connection;
        document.getElementById('conn').className = 'badge ' + (s.connection === 'open' ? 'ok' : 'warn');
        document.getElementById('phone').textContent = s.phone || '—';
        const card = document.getElementById('qrCard');
        if (s.registered || s.connection === 'open') {
          card.innerHTML = '<p class="hint">✅ Sesión vinculada. Ya puedes enviar mensajes desde la web.</p>';
        } else if (s.hasQr) {
          const q = await (await fetch('/qr' + Q)).json();
          card.querySelector('#qrWrap').innerHTML = '<img src="' + q.dataUrl + '" alt="QR de WhatsApp"/>';
        }
      } catch (e) { /* reintenta */ }
    }
    setInterval(refresh, 3000);
    refresh();
    document.getElementById('pairBtn').addEventListener('click', async () => {
      const phone = document.getElementById('phoneInput').value;
      const msg = document.getElementById('pairMsg');
      document.getElementById('pairBtn').disabled = true;
      msg.textContent = 'Pidiendo código…';
      try {
        const r = await fetch('/pair' + Q, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone })
        });
        const d = await r.json();
        msg.textContent = r.ok ? 'Código: ' + d.code : 'Error: ' + (d.error || r.status);
      } catch (e) {
        msg.textContent = 'Error de conexión.';
      }
      document.getElementById('pairBtn').disabled = false;
    });
  </script>
</main>
</body>
</html>`);
});

app.get('/qr', requireToken, (_req, res) => {
  if (!bot.qrDataUrl) return res.status(204).end();
  res.json({ qr: bot.lastQr, dataUrl: bot.qrDataUrl });
});

app.post('/pair', requireToken, async (req, res) => {
  try {
    const phone = String(req.body?.phone ?? '').trim();
    const result = await bot.requestPairing(phone);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/send', requireToken, async (req, res) => {
  try {
    const phone = String(req.body?.phone ?? '').trim();
    const message = String(req.body?.message ?? '').trim();
    if (!phone || !message) {
      return res.status(400).json({ ok: false, error: 'Faltan "phone" o "message".' });
    }
    const media = Array.isArray(req.body?.media)
      ? req.body.media
          .filter((m) => m && typeof m.dataUrl === 'string' && m.dataUrl.length > 0 && typeof m.mimeType === 'string')
          .slice(0, 10)
      : [];
    const result = await bot.send(phone, message, media);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.post('/logout', requireToken, async (_req, res) => {
  try {
    await bot.logout();
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`whatsapp-bot escuchando en http://${HOST}:${PORT}`);
  console.log(`BOT_TOKEN: ${BOT_TOKEN ? 'configurado' : 'VACÍO (no seguro, ponlo en .env)'}`);
});