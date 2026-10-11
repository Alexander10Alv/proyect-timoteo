import { NextResponse } from 'next/server';
import {
  WHATSAPP_TEMPLATES,
  type WhatsAppMedia,
  type WhatsAppRecipient,
  type WhatsAppSendResult,
  type WhatsAppSendResponse,
} from '@/services/whatsappService';

const BOT_URL = process.env.WHATSAPP_BOT_URL?.replace(/\/$/, '') ?? '';
const BOT_TOKEN = process.env.WHATSAPP_BOT_TOKEN ?? '';

async function callBot(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${BOT_URL}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'x-bot-token': BOT_TOKEN,
      ...(init?.headers ?? {}),
    },
  });
}

function resolveMessages(body: {
  message?: string;
  templateId?: string;
  recipients?: WhatsAppRecipient[];
}): { text: string; recipients: WhatsAppRecipient[] } {
  const recipients = Array.isArray(body.recipients) ? body.recipients : [];
  const raw = String(body.message ?? '').trim();
  const templateBody =
    body.templateId && body.templateId !== 'custom' && body.templateId in WHATSAPP_TEMPLATES
      ? WHATSAPP_TEMPLATES[body.templateId as keyof typeof WHATSAPP_TEMPLATES].body
      : '';
  const base = raw || templateBody;
  return {
    text: base,
    recipients,
  };
}

export async function POST(request: Request) {
  if (!BOT_URL || !BOT_TOKEN) {
    return NextResponse.json(
      { error: 'Bot de WhatsApp no configurado (WHATSAPP_BOT_URL / WHATSAPP_BOT_TOKEN).' },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { recipients?: WhatsAppRecipient[]; message?: string; templateId?: string; media?: WhatsAppMedia[] }
    | null;

  const { text, recipients } = resolveMessages(body ?? {});

  if (recipients.length === 0 || !text) {
    return NextResponse.json({ error: 'Faltan "recipients" o "message".' }, { status: 400 });
  }

  const media = Array.isArray(body?.media) ? body.media.filter((m) => m?.dataUrl && m?.mimeType) : [];

  const settled = await Promise.allSettled(
    recipients.map(async (r) => {
      const phone = String(r.phone ?? '').trim();
      const message = text.replace(/\{\{nombre\}\}/g, r.name ?? '');
      const resp = await callBot('/send', {
        method: 'POST',
        body: JSON.stringify({ phone, message, media }),
      });
      const data = (await resp.json().catch(() => null)) as { ok?: boolean; jid?: string; error?: string } | null;
      return {
        recipientUserId: r.userId,
        phone,
        status: resp.ok ? ('SENT' as const) : ('FAILED' as const),
        providerMessageId: data?.jid,
        error: resp.ok ? undefined : data?.error ?? `Bot HTTP ${resp.status}`,
        sentAt: new Date(),
      };
    })
  );

  const results: WhatsAppSendResult[] = settled.map((s) =>
    s.status === 'fulfilled'
      ? s.value
      : {
          recipientUserId: 'unknown',
          phone: '',
          status: 'FAILED',
          error: 'Error de conexión con el bot',
          sentAt: new Date(),
        }
  );

  const response: WhatsAppSendResponse = {
    totalRequested: results.length,
    totalSent: results.filter((r) => r.status === 'SENT').length,
    totalFailed: results.filter((r) => r.status === 'FAILED').length,
    results,
    mode: 'live',
  };

  return NextResponse.json(response);
}