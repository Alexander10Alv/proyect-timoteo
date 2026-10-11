import { NextResponse } from 'next/server';

const BOT_URL = process.env.WHATSAPP_BOT_URL?.replace(/\/$/, '') ?? '';
const BOT_TOKEN = process.env.WHATSAPP_BOT_TOKEN ?? '';

export async function POST() {
  if (!BOT_URL || !BOT_TOKEN) {
    return NextResponse.json({ error: 'Bot no configurado.' }, { status: 503 });
  }
  try {
    const resp = await fetch(`${BOT_URL}/logout`, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'x-bot-token': BOT_TOKEN },
    });
    const data = await resp.json().catch(() => null);
    return NextResponse.json(data ?? { ok: resp.ok }, { status: resp.ok ? 200 : 400 });
  } catch {
    return NextResponse.json({ error: 'No se pudo conectar con el bot.' }, { status: 502 });
  }
}