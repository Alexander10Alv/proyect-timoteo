import { NextResponse } from 'next/server';

const BOT_URL = process.env.WHATSAPP_BOT_URL?.replace(/\/$/, '') ?? '';
const BOT_TOKEN = process.env.WHATSAPP_BOT_TOKEN ?? '';

export async function GET() {
  if (!BOT_URL || !BOT_TOKEN) {
    return NextResponse.json({ configured: false, registered: false, phone: null, connection: 'unconfigured' });
  }
  try {
    const resp = await fetch(`${BOT_URL}/status`, {
      cache: 'no-store',
      headers: { 'x-bot-token': BOT_TOKEN },
    });
    const data = await resp.json().catch(() => null);
    return NextResponse.json({ configured: true, ...(data ?? {}) });
  } catch {
    return NextResponse.json({ configured: true, connection: 'unreachable', registered: false, phone: null });
  }
}