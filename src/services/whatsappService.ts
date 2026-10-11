/**
 * whatsappService — Cliente del bot de WhatsApp (whatsapp-bot/ con Baileys).
 *
 * El envío real ocurre en el servidor (src/app/api/whatsapp/*), que a su vez
 * llama al bot local (whatsapp-bot/, puerto 3030) con un token interno.
 * Configura en `.env`:
 *   WHATSAPP_BOT_URL="http://127.0.0.1:3030"
 *   WHATSAPP_BOT_TOKEN="..."
 */

export type WhatsAppTemplateId =
  | 'welcome'
  | 'course_reminder'
  | 'event_invite'
  | 'custom';

export interface WhatsAppRecipient {
  userId: string;
  name: string;
  phone: string;
}

export interface WhatsAppMedia {
  name: string;
  mimeType: string;
  dataUrl: string;
}

export interface WhatsAppSendPayload {
  recipients: WhatsAppRecipient[];
  templateId: WhatsAppTemplateId;
  message: string;
  media?: WhatsAppMedia[];
}

export interface WhatsAppSendResult {
  recipientUserId: string;
  phone: string;
  status: 'SENT' | 'FAILED';
  providerMessageId?: string;
  error?: string;
  sentAt: Date;
}

export interface WhatsAppSendResponse {
  totalRequested: number;
  totalSent: number;
  totalFailed: number;
  results: WhatsAppSendResult[];
  mode: 'mock' | 'live';
}

export const WHATSAPP_TEMPLATES: Record<Exclude<WhatsAppTemplateId, 'custom'>, { label: string; body: string }> = {
  welcome: {
    label: 'Bienvenida',
    body: 'Hola {{nombre}} 👋 Bienvenido a Proyecto Timoteo. Explora nuestros cursos y charlas en nuestra plataforma educativa.',
  },
  course_reminder: {
    label: 'Recordatorio de curso',
    body: 'Hola {{nombre}}, te recordamos que tu curso tiene sesión esta semana. Revisa los enlaces de reunión en tu muro educativo.',
  },
  event_invite: {
    label: 'Invitación a evento',
    body: 'Hola {{nombre}}, estás invitado a nuestro próximo evento. Consulta fechas e inscripciones en nuestra plataforma educativa.',
  },
};

export function renderTemplate(
  templateId: WhatsAppTemplateId,
  message: string | undefined,
  recipientName: string
): string {
  if (templateId === 'custom') return message ?? '';
  return (WHATSAPP_TEMPLATES[templateId]?.body ?? '').replace('{{nombre}}', recipientName);
}

export async function sendBulkWhatsAppMessages(payload: WhatsAppSendPayload): Promise<WhatsAppSendResponse> {
  const response = await fetch('/api/whatsapp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = (await response.json().catch(() => null)) as WhatsAppSendResponse | { error?: string } | null;

  if (!response.ok) {
    throw new Error((data && 'error' in data && data.error) || `Error del bot (HTTP ${response.status}).`);
  }
  return data as WhatsAppSendResponse;
}

export function buildWhatsAppDeepLink(phone: string, message: string): string {
  const normalized = phone.replace(/[^\d]/g, '');
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}