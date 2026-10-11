import { NextResponse } from 'next/server';
import { createTransport, type SendMailOptions } from 'nodemailer';
import {
  MAIL_TEMPLATES,
  type MailAttachment,
  type MailRecipient,
  type MailSendResponse,
  type MailSendResult,
} from '@/services/mailService';

const SMTP_HOST = process.env.MAIL_SMTP_HOST ?? '';
const SMTP_PORT = Number(process.env.MAIL_SMTP_PORT || 587);
const SMTP_USER = process.env.MAIL_SMTP_USER ?? '';
const SMTP_PASS = process.env.MAIL_SMTP_PASS ?? '';
const MAIL_FROM = process.env.MAIL_FROM ?? 'Proyecto Timoteo <no-reply@proyectotimoteo.org>';
const SENDER_NAME = process.env.MAIL_SENDER_NAME ?? 'Proyecto Timoteo';

function isConfigured(): boolean {
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

function resolveBody(body: {
  subject?: string;
  body?: string;
  templateId?: string;
}): { subject: string; text: string } {
  const subject = String(body.subject ?? '').trim();
  const rawText = String(body.body ?? '').trim();
  const template = body.templateId && body.templateId in MAIL_TEMPLATES ? MAIL_TEMPLATES[body.templateId as keyof typeof MAIL_TEMPLATES] : null;
  return {
    subject: subject || (template?.subject ?? '(sin asunto)'),
    text: rawText || (template?.body ?? ''),
  };
}

function toTransportAttachments(attachments?: MailAttachment[]): SendMailOptions['attachments'] {
  if (!Array.isArray(attachments)) return undefined;
  const out: SendMailOptions['attachments'] = [];
  for (const a of attachments.slice(0, 10)) {
    if (!a?.filename) continue;
    if (a.contentBase64) out.push({ filename: a.filename, content: Buffer.from(a.contentBase64, 'base64') });
    else if (a.url) out.push({ filename: a.filename, path: a.url });
  }
  return out.length > 0 ? out : undefined;
}

export async function POST(request: Request) {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: 'Correo no configurado (MAIL_SMTP_HOST / MAIL_SMTP_USER / MAIL_SMTP_PASS).' },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => null)) as {
    recipients?: MailRecipient[];
    templateId?: string;
    subject?: string;
    body?: string;
    attachments?: MailAttachment[];
  } | null;

  const recipients = (body?.recipients ?? []).filter((r) => (r?.email ?? '').includes('@'));
  if (recipients.length === 0) {
    return NextResponse.json({ error: 'Faltan "recipients" con correo válido.' }, { status: 400 });
  }

  const { subject, text } = resolveBody(body ?? {});
  if (!text) {
    return NextResponse.json({ error: 'Falta el "body" del correo.' }, { status: 400 });
  }

  const transport = createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    tls: { rejectUnauthorized: false },
  });

  try {
    await transport.verify();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'No se pudo conectar al servidor SMTP.';
    return NextResponse.json({ error: `SMTP no responde: ${message}` }, { status: 502 });
  }

  const attachments = toTransportAttachments(body?.attachments);

  const settled = await Promise.allSettled(
    recipients.map(async (r) => {
      const name = r.name ?? '';
      const mail = {
        from: MAIL_FROM,
        to: r.email,
        subject: subject.replace(/\{\{nombre\}\}/g, name),
        text: text.replace(/\{\{nombre\}\}/g, name),
        ...(attachments && attachments.length > 0 ? { attachments } : {}),
      };
      try {
        const info = await transport.sendMail(mail);
        return {
          recipientUserId: r.userId,
          email: r.email,
          status: 'SENT' as const,
          providerMessageId: info.messageId,
          sentAt: new Date(),
        };
      } catch (err) {
        return {
          recipientUserId: r.userId,
          email: r.email,
          status: 'FAILED' as const,
          error: err instanceof Error ? err.message : 'Error al enviar',
          sentAt: new Date(),
        };
      }
    })
  );

  const results: MailSendResult[] = settled.map((s) =>
    s.status === 'fulfilled'
      ? s.value
      : {
          recipientUserId: 'unknown',
          email: '',
          status: 'FAILED',
          error: 'Error de conexión con el servidor SMTP',
          sentAt: new Date(),
        }
  );

  const response: MailSendResponse = {
    totalRequested: recipients.length,
    totalSent: results.filter((r) => r.status === 'SENT').length,
    totalFailed: results.filter((r) => r.status === 'FAILED').length,
    results,
    mode: 'live',
  };

  return NextResponse.json(response);
}