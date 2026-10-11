# whatsapp-bot

Servicio de WhatsApp para Proyecto Timoteo basado en **Baileys v7** (`@whiskeysockets/baileys@7.0.0-rc.14`). Requiere **Node.js 20+** (ESM).

> Es un cliente NO oficial del protocolo de WhatsApp Web. Úsalo responsablemente y según los Términos de WhatsApp. No está pensado para spam ni mensajería masiva abusiva.

## Puesta en marcha (local)

```bash
cd whatsapp-bot
cp .env.example .env        # edita BOT_TOKEN con un secreto
npm install
npm start                   # (o: npm run dev para auto-reload)
```

- Primera vez: el bot genera un **QR**. Ábrelo en `/qr` (o mira la consola).
- Escanéalo con la app de WhatsApp del número remitente: **Ajustes → Dispositivos vinculados → Vincular un dispositivo**.
- En el siguiente arranque la sesión se reutiliza (carpeta `auth_info_baileys/`).

## API interna (protegida con `x-bot-token` o `?token=`)

| Método | Ruta        | Body / Respuesta |
|--------|-------------|------------------|
| GET    | `/status`   | `{ connection, registered, phone, hasQr, pairingReady, lastDisconnect }` |
| GET    | `/qr`       | `{ qr, dataUrl }` (204 si aún no hay QR) |
| POST   | `/pair`     | `{ phone }` → `{ code: "XXXX-XXXX" }` (código de vinculación, alternativa al QR) |
| POST   | `/send`     | `{ phone, message }` → `{ ok, jid }` |
| POST   | `/logout`   | desvincula y borra la sesión |

El teléfono siempre en **dígitos con código de país** (ej. `51960906717`), sin `+`/espacios.

## Vincular el número

- **QR (recomendado):** `GET /qr`, escanea con el teléfono.
- **Código de vinculación (respaldo):** `POST /pair` con `{ "phone": "51960906717" }`, y en el teléfono: *Dispositivos vinculados → Vincular un dispositivo → Vincular con número de teléfono* e ingresa el código. Solo puede llamarse cuando el QR ya está disponible (`pairingReady`).

## Despliegue en VPS (PM2)

```bash
cd whatsapp-bot
npm ci --omit=dev
pm2 start src/server.js --name whatsapp-bot
pm2 save
```

- La sesión queda persistida en `auth_info_baileys/` (fuera de git; es sensible, equivalente a una llave privada).
- El bot se **reconecta solo** tras caídas (salvo que te desvincules manualmente).
- Configúralo con `HOST=127.0.0.1` y expón la web hacia el bot por el puerto interno; nunca expongas `3030` al exterior.

## Parches aplicados (issues reales)

- **ERROR 463**: antes de enviar a un número, resuelve el LID (`signalRepository.lidMapping.getLIDForPN`) y envía al `@lid` (issue #2683).
- **Pairing code**: solo se pide cuando el socket emite el QR; de lo contrario Baileys lanza `Connection Closed (428)` (issues #1382 / #1562).
- **Reconexión**: se re-abre el socket en `close`, cubriendo el `restartRequired` posterior al escaneo.
- **QR**: `printQRInTerminal` está deprecado → el `qr` se expone por API y se renderiza con `qrcode`.
- **Retries**: `getMessage` en la config del socket para evitar mensajes atascados.