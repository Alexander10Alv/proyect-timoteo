import { NextResponse } from 'next/server';

const BOT_URL = process.env.WHATSAPP_BOT_URL?.replace(/\/$/, '') ?? '';
const BOT_TOKEN = process.env.WHATSAPP_BOT_TOKEN ?? '';

export async function POST(request: Request) {
  if (!BOT_URL || !BOT_TOKEN) {
    return NextResponse.json({ error: 'Bot no configurado.' }, { status: 503 });
  }
  const body = (await request.json().catch(() => null)) as { phone?: string } | null;
  const phone = String(body?.phone ?? '').trim();
  if (!phone) return NextResponse.json({ error: 'Falta "phone".' }, { status: 400 });

  try {
    const resp = await fetch(`${BOT_URL}/pair`, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', 'x-bot-token': BOT_TOKEN },
      body: JSON.stringify({ phone }),
    });
    const data = await resp.json().catch(() => null);
    return NextResponse.json(data ?? { error: 'Respuesta vacía del bot.' }, { status: resp.ok ? 200 : 400 });
  } catch {
    return NextResponse.json({ error: 'No se pudo conectar con el bot.' }, { status: 502 });
  }
}