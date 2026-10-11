'use client';

import * as React from 'react';
import { Modal, Button, Textarea, Badge, Progress, Select } from '@/components/ui';
import type { User, Course } from '@/types';
import {
  sendBulkWhatsAppMessages,
  WHATSAPP_TEMPLATES,
  type WhatsAppTemplateId,
  type WhatsAppSendResponse,
  type WhatsAppMedia,
} from '@/services/whatsappService';
import { useAppStore } from '@/store';
import { MessageCircle, Send, Users, CheckCircle2, XCircle, ExternalLink, Search, Paperclip, X } from 'lucide-react';

function buildWhatsAppDeepLink(phone: string, message: string): string {
  const normalized = phone.replace(/[^\d]/g, '');
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: Array<{ userId: string; name: string; phone?: string; email: string }>;
  preselectedIds?: string[];
}

export function WhatsAppModal({ isOpen, onClose, candidates, preselectedIds }: WhatsAppModalProps) {
  const logNotification = useAppStore((s) => s.logNotification);
  const user = useAppStore((s) => s.user);
  const courses = useAppStore((s) => s.courses);
  const fetchCourses = useAppStore((s) => s.fetchCourses);
  const coursesLoading = useAppStore((s) => s.coursesLoading);

  const [templateId, setTemplateId] = React.useState<WhatsAppTemplateId>('welcome');
  const [messageBody, setMessageBody] = React.useState(WHATSAPP_TEMPLATES.welcome.body);
  const [attachments, setAttachments] = React.useState<WhatsAppMedia[]>([]);
  const [relatedId, setRelatedId] = React.useState<string | null>(null);
  const [relatedQuery, setRelatedQuery] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [result, setResult] = React.useState<WhatsAppSendResponse | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [recipientQuery, setRecipientQuery] = React.useState('');
  const [botStatus, setBotStatus] = React.useState<{
    configured: boolean;
    registered: boolean;
    connection: string;
    phone: string | null;
  }>({ configured: false, registered: false, connection: 'unknown', phone: null });

  React.useEffect(() => {
    if (!isOpen) return;
    fetch('/api/whatsapp/status', { cache: 'no-store' })
      .then((r) => r.json())
      .then(setBotStatus)
      .catch(() => setBotStatus((s) => ({ ...s, configured: true, connection: 'unreachable' })));
  }, [isOpen]);

  React.useEffect(() => {
    if (isOpen && courses.length === 0) fetchCourses();
  }, [isOpen, courses.length, fetchCourses]);

  const withPhone = candidates.filter((r) => (r.phone ?? '').trim().length > 0);
  const withoutPhone = candidates.filter((r) => !(r.phone ?? '').trim().length);
  const validRecipients = candidates.filter((r) => selectedIds.has(r.userId) && (r.phone ?? '').trim().length > 0);
  const skipped = withoutPhone.length;
  const allSelected = withPhone.length > 0 && withPhone.every((r) => selectedIds.has(r.userId));

  // Búsqueda dinámica: filtra por nombre, email o teléfono (ignora acentos).
  const visibleCandidates = React.useMemo(() => {
    const q = recipientQuery.trim().toLowerCase();
    if (!q) return candidates;
    const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return candidates.filter(
      (c) => norm(c.name).includes(norm(q)) || norm(c.email).includes(norm(q)) || (c.phone ?? '').toLowerCase().includes(q)
    );
  }, [candidates, recipientQuery]);
  const visibleWithPhone = visibleCandidates.filter((c) => (c.phone ?? '').trim().length > 0);
  const allVisibleSelected = visibleWithPhone.length > 0 && visibleWithPhone.every((c) => selectedIds.has(c.userId));

  // Al abrir: si hay selección previa se usa, si no se marcan todos los que tienen teléfono.
  React.useEffect(() => {
    if (!isOpen) return;
    setRecipientQuery('');
    setSelectedIds(
      new Set(
        (preselectedIds && preselectedIds.length > 0 ? preselectedIds : withPhone.map((r) => r.userId)).filter((id) =>
          candidates.some((r) => r.userId === id && (r.phone ?? '').trim().length > 0)
        )
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleWithPhone.forEach((r) => next.delete(r.userId));
      } else {
        visibleWithPhone.forEach((r) => next.add(r.userId));
      }
      return next;
    });
  };

  const toggleOne = (userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const normText = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const showRelated = templateId === 'course_reminder' || templateId === 'event_invite';
  const relatedType: Course['type'] = templateId === 'event_invite' ? 'EVENT' : 'COURSE';
  const relatedAll = showRelated ? courses.filter((c) => c.type === relatedType) : [];
  const filteredRelated = relatedAll.filter((c) => normText(c.title).includes(normText(relatedQuery.trim())));
  const selectedRelated = relatedAll.find((c) => c.id === relatedId) ?? null;
  const relatedBlock = selectedRelated
    ? `📌 ${selectedRelated.title}\n${(selectedRelated.description ?? '').slice(0, 160)}${(selectedRelated.description ?? '').length > 160 ? '…' : ''}\n🔗 ${window.location.origin}/cursos/${selectedRelated.id}`
    : '';

  const preview = messageBody
    .replace(/\{\{nombre\}\}/g, validRecipients[0]?.name ?? 'Ana')
    .concat(relatedBlock ? `\n\n${relatedBlock}` : '');

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).slice(0, 10 - attachments.length).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments((prev) => [
          ...prev,
          { name: file.name, mimeType: file.type || 'application/octet-stream', dataUrl: String(reader.result) },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSend = async () => {
    setIsSending(true);
    setResult(null);
    try {
      const response = await sendBulkWhatsAppMessages({
        recipients: validRecipients.map((r) => ({ userId: r.userId, name: r.name, phone: r.phone as string })),
        templateId,
        message: [messageBody, relatedBlock].filter(Boolean).join('\n\n'),
        media: attachments.length > 0 ? attachments : undefined,
      });
      setResult(response);

      logNotification({
        channel: 'WHATSAPP',
        templateId,
        message: preview.slice(0, 200),
        totalSent: response.totalSent,
        totalFailed: response.totalFailed,
        recipientCount: response.totalRequested,
        sentByUserId: user?.id ?? 'system',
        mode: response.mode,
      });
    } catch (err) {
      setResult({
        totalRequested: validRecipients.length,
        totalSent: 0,
        totalFailed: validRecipients.length,
        results: validRecipients.map((r) => ({
          recipientUserId: r.userId,
          phone: r.phone as string,
          status: 'FAILED',
          error: err instanceof Error ? err.message : 'Error al conectar con el bot',
          sentAt: new Date(),
        })),
        mode: 'live',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setAttachments([]);
    setRelatedId(null);
    setRelatedQuery('');
    setMessageBody(WHATSAPP_TEMPLATES.welcome.body);
    setTemplateId('welcome');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Enviar por WhatsApp"
      description={`${validRecipients.length} destinatario(s) seleccionado(s)${skipped > 0 ? ` · ${skipped} sin teléfono no son seleccionables` : ''}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Estado del servicio */}
        <div className="flex items-center gap-2 rounded-lg bg-dark-50 dark:bg-dark-800/50 px-4 py-3">
          <MessageCircle className="h-4 w-4 text-green-600 dark:text-green-400" aria-hidden="true" />
          <p className="text-body-sm text-dark-600 dark:text-dark-300">
            Estado del bot:{' '}
            <Badge variant={botStatus.registered ? 'success' : botStatus.configured ? 'warning' : 'default'} size="sm">
              {botStatus.registered
                ? `Conectado · ${botStatus.phone ?? ''}`
                : botStatus.configured
                  ? botStatus.connection === 'unreachable'
                    ? 'Bot sin conexión'
                    : 'Bot sin sesión vinculada'
                  : 'Simulado (mock)'}
            </Badge>
          </p>
        </div>

        {!result && (
          <>
            {/* Selección de destinatarios */}
            <fieldset>
              <legend className="mb-3 flex items-center justify-between text-body-sm font-medium text-dark-700 dark:text-dark-300">
                <span>Destinatarios</span>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-caption font-medium text-primary-600 hover:underline dark:text-primary-400"
                >
                  {allVisibleSelected ? 'Quitar todos' : `Seleccionar todos (${visibleWithPhone.length})`}
                </button>
              </legend>
              <div className="relative mb-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-400" aria-hidden="true" />
                <input
                  type="search"
                  value={recipientQuery}
                  onChange={(e) => setRecipientQuery(e.target.value)}
                  placeholder="Buscar destinatario (nombre, email o teléfono)…"
                  aria-label="Buscar destinatario"
                  className="w-full rounded-lg border border-dark-300 bg-white py-2 pl-10 pr-4 text-body-sm text-dark-900 placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-dark-600 dark:bg-dark-900 dark:text-dark-100 dark:placeholder-dark-500"
                />
              </div>
              <div className="max-h-44 overflow-y-auto rounded-lg border border-dark-200 dark:border-dark-700">
                {visibleCandidates.length === 0 ? (
                  <p className="px-4 py-6 text-center text-body-sm text-dark-500 dark:text-dark-400">
                    No se encontraron usuarios para «{recipientQuery.trim()}».
                  </p>
                ) : (
                  visibleCandidates.map((c) => {
                    const hasPhone = (c.phone ?? '').trim().length > 0;
                    const checked = selectedIds.has(c.userId);
                    return (
                      <label
                        key={c.userId}
                        className={`flex items-center justify-between gap-3 px-4 py-2.5 text-body-sm odd:bg-dark-50 dark:odd:bg-dark-800/40 ${
                          hasPhone ? 'cursor-pointer' : 'opacity-50'
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={!hasPhone}
                            onChange={() => toggleOne(c.userId)}
                            aria-label={`Seleccionar a ${c.name}`}
                            className="h-4 w-4 shrink-0 rounded border-dark-300 accent-[#c87a4a]"
                          />
                          <span className="min-w-0">
                            <span className="font-medium text-dark-900 dark:text-dark-100">{c.name}</span>
                            <span className="ml-2 truncate text-caption text-dark-400 dark:text-dark-500">{c.email}</span>
                          </span>
                        </span>
                        {hasPhone ? (
                          <span className="shrink-0 font-mono text-caption text-dark-400 dark:text-dark-500">{c.phone}</span>
                        ) : (
                          <span className="shrink-0 text-caption italic text-dark-400 dark:text-dark-500">sin teléfono</span>
                        )}
                      </label>
                    );
                  })
                )}
              </div>
            </fieldset>

            {/* Plantillas */}
            <fieldset>
              <legend className="mb-3 text-body-sm font-medium text-dark-700 dark:text-dark-300">
                Plantilla del mensaje
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {(Object.keys(WHATSAPP_TEMPLATES) as Array<keyof typeof WHATSAPP_TEMPLATES>).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setTemplateId(key);
                      setMessageBody(WHATSAPP_TEMPLATES[key].body);
                      setRelatedId(null);
                      setRelatedQuery('');
                    }}
                    aria-pressed={templateId === key}
                    className={
                      templateId === key
                        ? 'rounded-lg border-2 border-primary-500 bg-primary-50 dark:bg-primary-900/20 px-4 py-3 text-left'
                        : 'rounded-lg border border-dark-200 dark:border-dark-700 px-4 py-3 text-left hover:border-primary-300'
                    }
                  >
                    <span className="text-body-sm font-medium text-dark-900 dark:text-dark-100">
                      {WHATSAPP_TEMPLATES[key].label}
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setTemplateId('custom');
                    setMessageBody('');
                    setRelatedId(null);
                    setRelatedQuery('');
                  }}
                  aria-pressed={templateId === 'custom'}
                  className={
                    templateId === 'custom'
                      ? 'rounded-lg border-2 border-primary-500 bg-primary-50 dark:bg-primary-900/20 px-4 py-3 text-left'
                      : 'rounded-lg border border-dark-200 dark:border-dark-700 px-4 py-3 text-left hover:border-primary-300'
                  }
                >
                  <span className="text-body-sm font-medium text-dark-900 dark:text-dark-100">Mensaje personalizado</span>
                </button>
              </div>
            </fieldset>

            {showRelated && (
              <fieldset>
                <legend className="mb-3 text-body-sm font-medium text-dark-700 dark:text-dark-300">
                  {templateId === 'event_invite' ? 'Seleccionar el evento' : 'Seleccionar el curso'}
                </legend>
                <div className="relative mb-2">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-400"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={relatedQuery}
                    onChange={(e) => setRelatedQuery(e.target.value)}
                    placeholder={`Buscar ${templateId === 'event_invite' ? 'evento' : 'curso'} por nombre…`}
                    aria-label={`Buscar ${templateId === 'event_invite' ? 'evento' : 'curso'}`}
                    className="w-full rounded-lg border border-dark-300 bg-white py-2 pl-10 pr-4 text-body-sm text-dark-900 placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-dark-600 dark:bg-dark-900 dark:text-dark-100 dark:placeholder-dark-500"
                  />
                </div>
                {coursesLoading ? (
                  <p className="rounded-lg bg-dark-50 dark:bg-dark-800/50 px-4 py-3 text-body-sm text-dark-500 dark:text-dark-400">
                    Cargando {templateId === 'event_invite' ? 'eventos' : 'cursos'}…
                  </p>
                ) : filteredRelated.length === 0 ? (
                  <p className="rounded-lg bg-dark-50 dark:bg-dark-800/50 px-4 py-3 text-body-sm text-dark-500 dark:text-dark-400">
                    No hay {templateId === 'event_invite' ? 'eventos' : 'cursos'} con ese nombre.
                  </p>
                ) : (
                  <Select
                    value={relatedId ?? ''}
                    onChange={(e) => setRelatedId(e.target.value || null)}
                    placeholder={`Elegir ${templateId === 'event_invite' ? 'evento' : 'curso'}…`}
                    options={filteredRelated.slice(0, 50).map((c) => ({ value: c.id, label: c.title }))}
                  />
                )}
                {selectedRelated && (
                  <div className="mt-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-caption font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-300">
                        Se adjuntará al mensaje
                      </p>
                      <button
                        type="button"
                        onClick={() => setRelatedId(null)}
                        className="text-caption font-medium text-primary-700 hover:underline dark:text-primary-300"
                      >
                        Quitar selección
                      </button>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-body-sm text-dark-800 dark:text-dark-100">
                      📌 {selectedRelated.title}
                      {'\n'}
                      {(selectedRelated.description ?? '').slice(0, 160)}
                      {'\n'}
                      🔗 {window.location.origin}/cursos/{selectedRelated.id}
                    </p>
                  </div>
                )}
              </fieldset>
            )}

            <Textarea
              label="Mensaje (editable)"
              rows={4}
              maxLength={1000}
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              placeholder="Escribe tu mensaje. Usa {{nombre}} para personalizar."
            />

            {/* Archivos adjuntos */}
            <fieldset>
              <legend className="mb-3 text-body-sm font-medium text-dark-700 dark:text-dark-300">
                Adjuntos (imágenes, PDF, documentos…)
              </legend>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-dark-300 hover:border-primary-400 px-4 py-5 text-body-sm font-medium text-dark-600 dark:border-dark-600 dark:text-dark-300">
                <Paperclip className="h-4 w-4" aria-hidden="true" />
                {attachments.length > 0 ? `Subir más (${attachments.length} adjunto(s))` : 'Seleccionar archivos'}
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                  className="sr-only"
                  onChange={(e) => {
                    handleFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
              </label>
              {attachments.length > 0 && (
                <ul role="list" className="mt-2 space-y-1.5">
                  {attachments.map((a, i) => (
                    <li key={`${a.name}-${i}`} className="flex items-center gap-2 rounded-lg bg-dark-50 dark:bg-dark-800/50 px-3 py-2">
                      <span className="min-w-0 flex-1 truncate text-body-sm text-dark-700 dark:text-dark-300">{a.name}</span>
                      <button
                        type="button"
                        onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-dark-400 hover:text-red-500"
                        aria-label={`Quitar ${a.name}`}
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </fieldset>

            {/* Vista previa tipo burbuja de WhatsApp */}
            <div>
              <p className="mb-2 text-body-sm font-medium text-dark-700 dark:text-dark-300">Vista previa</p>
              <div className="rounded-xl bg-[#e7ffdb] p-4 dark:bg-[#075e54]/30">
                <p className="whitespace-pre-wrap rounded-lg rounded-tl-none bg-white px-3 py-2 text-body-sm text-dark-800 shadow-sm dark:bg-dark-950 dark:text-dark-100">
                  {preview || '(vacío)'}
                </p>
                <p className="mt-1 text-right text-caption text-dark-400 dark:text-dark-500">
                  {'{{nombre}}'} → {validRecipients[0]?.name ?? 'Destinatario'} · 12:00 ✓✓
                </p>
              </div>
            </div>

            <Button size="lg" className="w-full" loading={isSending} onClick={handleSend} disabled={validRecipients.length === 0}>
              <Send className="mr-2 h-4 w-4" aria-hidden="true" />
              Enviar a {validRecipients.length} destinatario(s)
            </Button>
          </>
        )}

        {/* Resultado del envío */}
        {result && (
          <div className="space-y-5 animate-fade-in">
            <div className="grid grid-cols-3 gap-3 text-center">
              <ResultStat icon={Users} label="Enviados" value={String(result.totalSent)} tone="ok" />
              <ResultStat icon={XCircle} label="Fallidos" value={String(result.totalFailed)} tone="bad" />
              <ResultStat label="Modo" value={result.mode.toUpperCase()} tone="neutral" icon={ExternalLink} />
            </div>

            {result.totalFailed > 0 && (
              <ul role="list" className="space-y-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
                {result.results.filter((r) => r.status === 'FAILED').map((r) => (
                  <li key={r.recipientUserId} className="flex items-center gap-2 text-body-sm text-red-600 dark:text-red-400">
                    <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {r.phone}: {r.error ?? 'Error desconocido'}
                  </li>
                ))}
              </ul>
            )}

            <Progress value={(result.totalSent / Math.max(result.totalRequested, 1)) * 100} showLabel label="Tasa de entrega" />

            <div className="rounded-lg bg-dark-50 dark:bg-dark-800/50 p-4">
              <p className="mb-2 text-caption font-semibold uppercase tracking-wide text-dark-500 dark:text-dark-400">
                Enlaces directos wa.me (para verificación manual)
              </p>
              <div className="max-h-32 space-y-1 overflow-y-auto">
                {validRecipients.slice(0, 8).map((r) => (
                  <a
                    key={r.userId}
                    href={buildWhatsAppDeepLink(r.phone ?? '', preview)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-body-sm text-primary-600 hover:underline dark:text-primary-400"
                  >
                    {r.name} — {r.phone}
                  </a>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                Cerrar
              </Button>
              <Button variant="ghost" className="flex-1" onClick={() => setResult(null)}>
                Enviar otro
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function ResultStat({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: string; tone: 'ok' | 'bad' | 'neutral' }) {
  return (
    <div className="rounded-lg border border-dark-200 dark:border-dark-700 p-3">
      <Icon className={
        tone === 'ok' ? 'mx-auto h-5 w-5 text-green-500' : tone === 'bad' ? 'mx-auto h-5 w-5 text-red-500' : 'mx-auto h-5 w-5 text-dark-400'
      } aria-hidden="true" />
      <p className="mt-1.5 font-serif text-heading-md font-semibold text-dark-900 dark:text-dark-100">{value}</p>
      <p className="text-caption uppercase tracking-wide text-dark-500 dark:text-dark-400">{label}</p>
    </div>
  );
}

export function SentBadge({ status }: { status: 'SENT' | 'FAILED' }) {
  return status === 'SENT' ? (
    <Badge variant="success" size="sm"><CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" />Enviado</Badge>
  ) : (
    <Badge variant="danger" size="sm"><XCircle className="mr-1 h-3 w-3" aria-hidden="true" />Fallido</Badge>
  );
}