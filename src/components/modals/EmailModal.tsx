'use client';

import * as React from 'react';
import { Modal, Button, Textarea, Badge, Progress, Select, Input } from '@/components/ui';
import type { Course } from '@/types';
import {
  sendBulkEmails,
  MAIL_TEMPLATES,
  type MailTemplateId,
  type MailSendResponse,
  type MailAttachment,
} from '@/services/mailService';
import { useAppStore } from '@/store';
import { Mail, Send, Users, CheckCircle2, XCircle, Search, Paperclip, X, Tag } from 'lucide-react';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: Array<{ userId: string; name: string; email: string; phone?: string }>;
  preselectedIds?: string[];
}

type EmailTemplateKey = Exclude<MailTemplateId, 'custom'>;

export function EmailModal({ isOpen, onClose, candidates, preselectedIds }: EmailModalProps) {
  const logNotification = useAppStore((s) => s.logNotification);
  const user = useAppStore((s) => s.user);
  const courses = useAppStore((s) => s.courses);
  const fetchCourses = useAppStore((s) => s.fetchCourses);
  const coursesLoading = useAppStore((s) => s.coursesLoading);

  const [templateId, setTemplateId] = React.useState<MailTemplateId>('welcome');
  const [subject, setSubject] = React.useState(MAIL_TEMPLATES.welcome.subject);
  const [body, setBody] = React.useState(MAIL_TEMPLATES.welcome.body);
  const [attachments, setAttachments] = React.useState<MailAttachment[]>([]);
  const [relatedId, setRelatedId] = React.useState<string | null>(null);
  const [relatedQuery, setRelatedQuery] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [result, setResult] = React.useState<MailSendResponse | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [recipientQuery, setRecipientQuery] = React.useState('');

  React.useEffect(() => {
    if (isOpen && courses.length === 0) fetchCourses();
  }, [isOpen, courses.length, fetchCourses]);

  const withEmail = candidates.filter((r) => (r.email ?? '').trim().includes('@'));
  const withoutEmail = candidates.filter((r) => !(r.email ?? '').trim().includes('@'));
  const validRecipients = candidates.filter((r) => selectedIds.has(r.userId) && (r.email ?? '').trim().includes('@'));
  const skipped = withoutEmail.length;
  const allSelected = withEmail.length > 0 && withEmail.every((r) => selectedIds.has(r.userId));

  const visibleCandidates = React.useMemo(() => {
    const q = recipientQuery.trim().toLowerCase();
    if (!q) return candidates;
    const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return candidates.filter(
      (c) => norm(c.name).includes(norm(q)) || norm(c.email).includes(norm(q)) || (c.phone ?? '').toLowerCase().includes(q)
    );
  }, [candidates, recipientQuery]);
  const visibleWithEmail = visibleCandidates.filter((c) => (c.email ?? '').trim().includes('@'));
  const allVisibleSelected = visibleWithEmail.length > 0 && visibleWithEmail.every((c) => selectedIds.has(c.userId));

  React.useEffect(() => {
    if (!isOpen) return;
    setRecipientQuery('');
    setSelectedIds(
      new Set(
        (preselectedIds && preselectedIds.length > 0 ? preselectedIds : withEmail.map((r) => r.userId)).filter((id) =>
          candidates.some((r) => r.userId === id && (r.email ?? '').trim().includes('@'))
        )
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleWithEmail.forEach((r) => next.delete(r.userId));
      } else {
        visibleWithEmail.forEach((r) => next.add(r.userId));
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

  const renderedBody = body.replace(/\{\{nombre\}\}/g, validRecipients[0]?.name ?? 'Ana');
  const previewBody = renderedBody.concat(relatedBlock ? `\n\n${relatedBlock}` : '');

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).slice(0, 10 - attachments.length).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments((prev) => [
          ...prev,
          { filename: file.name, contentBase64: String(reader.result).split(',')[1] },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSend = async () => {
    setIsSending(true);
    setResult(null);
    try {
      const response = await sendBulkEmails({
        recipients: validRecipients.map((r) => ({ userId: r.userId, name: r.name, email: r.email })),
        templateId: 'custom',
        subject,
        body: [body, relatedBlock].filter(Boolean).join('\n\n'),
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      setResult(response);

      logNotification({
        channel: 'EMAIL',
        templateId,
        message: previewBody.slice(0, 200),
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
          email: r.email,
          status: 'FAILED',
          error: err instanceof Error ? err.message : 'Error al conectar con el proveedor de correo',
          sentAt: new Date(),
        })),
        mode: 'mock',
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
    setSubject(MAIL_TEMPLATES.welcome.subject);
    setBody(MAIL_TEMPLATES.welcome.body);
    setTemplateId('welcome');
    onClose();
  };

  const selectTemplate = (key: EmailTemplateKey) => {
    setTemplateId(key);
    setSubject(MAIL_TEMPLATES[key].subject);
    setBody(MAIL_TEMPLATES[key].body);
    setRelatedId(null);
    setRelatedQuery('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Enviar por correo"
      description={`${validRecipients.length} destinatario(s) seleccionado(s)${skipped > 0 ? ` · ${skipped} sin correo no son seleccionables` : ''}`}
      size="lg"
    >
      <div className="space-y-6">
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
                  {allVisibleSelected ? 'Quitar todos' : `Seleccionar todos (${visibleWithEmail.length})`}
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
                    const hasEmail = (c.email ?? '').trim().includes('@');
                    const checked = selectedIds.has(c.userId);
                    return (
                      <label
                        key={c.userId}
                        className={`flex items-center justify-between gap-3 px-4 py-2.5 text-body-sm odd:bg-dark-50 dark:odd:bg-dark-800/40 ${
                          hasEmail ? 'cursor-pointer' : 'opacity-50'
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={!hasEmail}
                            onChange={() => toggleOne(c.userId)}
                            aria-label={`Seleccionar a ${c.name}`}
                            className="h-4 w-4 shrink-0 rounded border-dark-300 accent-[#c87a4a]"
                          />
                          <span className="min-w-0">
                            <span className="font-medium text-dark-900 dark:text-dark-100">{c.name}</span>
                            <span className="ml-2 truncate text-caption text-dark-400 dark:text-dark-500">{c.email}</span>
                          </span>
                        </span>
                        {hasEmail ? (
                          <span className="shrink-0 font-mono text-caption text-dark-400 dark:text-dark-500">{c.email}</span>
                        ) : (
                          <span className="shrink-0 text-caption italic text-dark-400 dark:text-dark-500">sin correo</span>
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
                Plantilla del correo
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {(Object.keys(MAIL_TEMPLATES) as EmailTemplateKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => selectTemplate(key)}
                    aria-pressed={templateId === key}
                    className={
                      templateId === key
                        ? 'rounded-lg border-2 border-primary-500 bg-primary-50 dark:bg-primary-900/20 px-4 py-3 text-left'
                        : 'rounded-lg border border-dark-200 dark:border-dark-700 px-4 py-3 text-left hover:border-primary-300'
                    }
                  >
                    <span className="text-body-sm font-medium text-dark-900 dark:text-dark-100">
                      {MAIL_TEMPLATES[key].subject}
                    </span>
                  </button>
                ))}
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
                        Se adjuntará al correo
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

            {/* Asunto + cuerpo */}
            <div className="space-y-3">
              <Input
                label="Asunto"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Asunto del correo"
              />
              <Textarea
                label="Mensaje (editable)"
                rows={6}
                maxLength={2000}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Escribe tu mensaje. Usa {{nombre}} para personalizar."
              />
            </div>

            {/* Adjuntos */}
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
                    <li key={`${a.filename}-${i}`} className="flex items-center gap-2 rounded-lg bg-dark-50 dark:bg-dark-800/50 px-3 py-2">
                      <span className="min-w-0 flex-1 truncate text-body-sm text-dark-700 dark:text-dark-300">{a.filename}</span>
                      <button
                        type="button"
                        onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-dark-400 hover:text-red-500"
                        aria-label={`Quitar ${a.filename}`}
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </fieldset>

            {/* Vista previa */}
            <div>
              <p className="mb-2 text-body-sm font-medium text-dark-700 dark:text-dark-300">Vista previa</p>
              <div className="rounded-xl border border-dark-200 dark:border-dark-700 p-4">
                <p className="flex items-center gap-2 text-body-sm font-medium text-dark-900 dark:text-dark-100">
                  <Tag className="h-4 w-4 text-primary-500" aria-hidden="true" />
                  {subject || '(sin asunto)'}
                </p>
                <p className="mt-2 whitespace-pre-wrap rounded-lg bg-dark-50 dark:bg-dark-800/50 px-3 py-2 text-body-sm text-dark-800 dark:text-dark-100">
                  {previewBody || '(vacío)'}
                </p>
                <p className="mt-1 text-right text-caption text-dark-400 dark:text-dark-500">
                  Para: {validRecipients[0]?.email ?? 'destinatario@correo.com'}
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
              <EmailResultStat icon={Users} label="Enviados" value={String(result.totalSent)} tone="ok" />
              <EmailResultStat icon={XCircle} label="Fallidos" value={String(result.totalFailed)} tone="bad" />
              <EmailResultStat label="Modo" value={result.mode.toUpperCase()} tone="neutral" icon={Mail} />
            </div>

            {result.totalFailed > 0 && (
              <ul role="list" className="space-y-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
                {result.results.filter((r) => r.status === 'FAILED').map((r) => (
                  <li key={r.recipientUserId} className="flex items-center gap-2 text-body-sm text-red-600 dark:text-red-400">
                    <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {r.email}: {r.error ?? 'Error desconocido'}
                  </li>
                ))}
              </ul>
            )}

            <Progress value={(result.totalSent / Math.max(result.totalRequested, 1)) * 100} showLabel label="Tasa de entrega" />

            <div className="flex flex-wrap items-center gap-2 rounded-lg bg-dark-50 dark:bg-dark-800/50 p-4">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" aria-hidden="true" />
              <p className="text-body-sm text-dark-600 dark:text-dark-300">
                {result.mode === 'mock'
                  ? 'Envío simulado (mock). Si es real, revisa la respuesta del servidor de correo.'
                  : 'Correos enviados por el servidor SMTP.'}
              </p>
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

function EmailResultStat({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: string; tone: 'ok' | 'bad' | 'neutral' }) {
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