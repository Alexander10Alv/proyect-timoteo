/**
 * mailService — Cliente del envío de correos.
 *
 * El envío real ocurre en el servidor (src/app/api/mail/send) usando SMTP
 * (Brevo / SendGrid / Amazon SES) con nodemailer. Configura en `.env`:
 *   MAIL_SMTP_HOST="smtp-relay.brevo.com"
 *   MAIL_SMTP_PORT="587"
 *   MAIL_SMTP_USER="..."
 *   MAIL_SMTP_PASS="..."
 *   MAIL_FROM="Proyecto Timoteo <no-reply@proyectotimoteo.org>"
 *
 * Sin configuración, el servidor responde 503 y el modal muestra el error.
 */

export type MailTemplateId = 'welcome' | 'course_reminder' | 'event_invite' | 'donation_receipt' | 'custom';

export interface MailAttachment {
  filename: string;
  contentBase64?: string;
  url?: string;
}

export interface MailRecipient {
  userId: string;
  name: string;
  email: string;
}

export interface MailSendPayload {
  recipients: MailRecipient[];
  templateId: MailTemplateId;
  subject?: string;
  body?: string;
  attachments?: MailAttachment[];
}

export interface MailSendResult {
  recipientUserId: string;
  email: string;
  status: 'SENT' | 'FAILED';
  providerMessageId?: string;
  error?: string;
  sentAt: Date;
}

export interface MailSendResponse {
  totalRequested: number;
  totalSent: number;
  totalFailed: number;
  results: MailSendResult[];
  mode: 'mock' | 'live';
}

export const MAIL_TEMPLATES: Record<Exclude<MailTemplateId, 'custom'>, { subject: string; body: string }> = {
  welcome: {
    subject: 'Bienvenido a Proyecto Timoteo',
    body: 'Hola {{nombre}}, gracias por unirte a nuestra plataforma ministerial y educativa.',
  },
  course_reminder: {
    subject: 'Recordatorio: tu curso continúa esta semana',
    body: 'Hola {{nombre}}, no olvides asistir a la sesión de tu curso. Encuentra el enlace en tu muro educativo.',
  },
  event_invite: {
    subject: 'Estás invitado a nuestro próximo evento',
    body: 'Hola {{nombre}}, queremos invitarte al próximo evento de Proyecto Timoteo. Consulta los detalles en la plataforma.',
  },
  donation_receipt: {
    subject: 'Recibo de tu donación — Proyecto Timoteo',
    body: 'Hola {{nombre}}, gracias por tu generosidad. Adjuntamos el comprobante de tu donación.',
  },
};

export async function sendBulkEmails(payload: MailSendPayload): Promise<MailSendResponse> {
  const response = await fetch('/api/mail/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = (await response.json().catch(() => null)) as MailSendResponse | { error?: string } | null;

  if (!response.ok) {
    throw new Error((data && 'error' in data && data.error) || `Error de correo (HTTP ${response.status}).`);
  }
  return data as MailSendResponse;
}