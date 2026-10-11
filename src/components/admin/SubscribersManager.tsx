'use client';

import * as React from 'react';
import { useAppStore } from '@/store';
import { Badge, Button, ConfirmModal, Modal } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import type { Subscriber, SubscriberStatus } from '@/types';
import { Eye, Mail, Users, UserX } from 'lucide-react';

const STATUS_LABELS: Record<SubscriberStatus, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  ACTIVE: { label: 'Activo', variant: 'success' },
  UNSUBSCRIBED: { label: 'Dado de baja', variant: 'warning' },
  BOUNCED: { label: 'Rebotado', variant: 'danger' },
};

type StatusFilter = 'ALL' | SubscriberStatus;

export function SubscribersManager() {
  const subscribers = useAppStore((s) => s.subscribers);
  const fetchSubscribers = useAppStore((s) => s.fetchSubscribers);
  const [filter, setFilter] = React.useState<StatusFilter>('ALL');
  const [viewing, setViewing] = React.useState<Subscriber | null>(null);
  const [unsubscribing, setUnsubscribing] = React.useState<Subscriber | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    void fetchSubscribers();
  }, [fetchSubscribers]);

  const counts = React.useMemo(
    () =>
      subscribers.reduce<Record<StatusFilter, number>>(
        (acc, s) => {
          acc[s.status] += 1;
          acc.ALL += 1;
          return acc;
        },
        { ALL: 0, ACTIVE: 0, UNSUBSCRIBED: 0, BOUNCED: 0 }
      ),
    [subscribers]
  );

  const filtered = filter === 'ALL' ? subscribers : subscribers.filter((s) => s.status === filter);

  const handleUnsubscribe = async () => {
    if (!unsubscribing) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/subscribers/${unsubscribing.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? 'No se pudo dar de baja la suscripción.');
      }
      await fetchSubscribers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al dar de baja la suscripción.');
    } finally {
      setBusy(false);
      setUnsubscribing(null);
    }
  };

  const FILTERS: Array<{ value: StatusFilter; label: string }> = [
    { value: 'ALL', label: 'Todos' },
    { value: 'ACTIVE', label: 'Activos' },
    { value: 'UNSUBSCRIBED', label: 'Dados de baja' },
    { value: 'BOUNCED', label: 'Rebotados' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-heading-lg font-semibold text-dark-900 dark:text-dark-100">
            Suscriptores del boletín
          </h2>
          <p className="text-body-sm text-dark-500 dark:text-dark-400">
            {counts.ACTIVE} activos · {counts.UNSUBSCRIBED} dados de baja · {counts.BOUNCED} rebotados · guardados en MySQL
          </p>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-amber-50 px-4 py-3 text-body-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar suscriptores">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            role="tab"
            aria-selected={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={
              filter === f.value
                ? 'rounded-full px-4 py-2 text-body-sm font-medium transition-colors bg-dark-900 text-white dark:bg-white dark:text-dark-900'
                : 'rounded-full px-4 py-2 text-body-sm font-medium transition-colors bg-dark-100 text-dark-600 hover:bg-dark-200 dark:bg-dark-800 dark:text-dark-300 dark:hover:bg-dark-700'
            }
          >
            {f.label} ({counts[f.value]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-dark-300 px-8 py-12 text-center dark:border-dark-600">
          <Mail className="mx-auto mb-3 h-8 w-8 text-dark-300 dark:text-dark-600" aria-hidden="true" />
          <p className="text-body-md text-dark-500 dark:text-dark-400">
            {subscribers.length === 0
              ? 'Aún no hay suscriptores. Se registran cuando alguien se suscribe al boletín desde el sitio.'
              : 'No hay suscriptores en este estado.'}
          </p>
        </div>
      ) : (
        <ul role="list" className="space-y-3">
          {filtered.map((subscriber) => (
            <li
              key={subscriber.id}
              className="flex flex-col gap-3 rounded-lg border border-dark-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-dark-700"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                  <Users className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-body-sm font-medium text-dark-900 dark:text-dark-100">
                    {[subscriber.firstName, subscriber.lastName].filter(Boolean).join(' ') || subscriber.email || `WhatsApp: ${subscriber.phone ?? '—'}`}
                  </p>
                  <p className="mt-0.5 text-caption text-dark-400 dark:text-dark-500">
                    {subscriber.email && `Correo: ${subscriber.email}`}
                    {subscriber.phone && ` · Celular: ${subscriber.phone}`}
                    {subscriber.church && ` · Iglesia: ${subscriber.church}`}
                    {subscriber.country && ` · País: ${subscriber.country} `}
                    · Suscrito el {formatDate(subscriber.subscribedAt)}
                    {subscriber.unsubscribedAt && ` · baja el ${formatDate(subscriber.unsubscribedAt)}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={`Ver datos de ${[subscriber.firstName, subscriber.lastName].filter(Boolean).join(' ') || subscriber.email || ''}`}
                  onClick={() => setViewing(subscriber)}
                >
                  <Eye className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  Ver datos
                </Button>
                <Badge variant={STATUS_LABELS[subscriber.status]?.variant ?? 'outline'} size="sm">
                  {STATUS_LABELS[subscriber.status]?.label ?? subscriber.status}
                </Badge>
                {subscriber.status === 'ACTIVE' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => setUnsubscribing(subscriber)}
                  >
                    <UserX className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                    Dar de baja
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        isOpen={!!unsubscribing}
        onClose={() => setUnsubscribing(null)}
        onConfirm={() => void handleUnsubscribe()}
        title="Dar de baja la suscripción"
        message={`Se quitará de la lista a ${unsubscribing?.email ?? unsubscribing?.phone ?? 'este suscriptor'}. Recuerda: si la sincronización con Brevo está activa, también se marcará como dado de baja al sincronizar.`}
        confirmText="Dar de baja"
        cancelText="Cancelar"
        variant="danger"
        loading={busy}
      />

      <Modal
        isOpen={!!viewing}
        onClose={() => setViewing(null)}
        title={`Datos del suscriptor`}
        description={viewing ? ([viewing.firstName, viewing.lastName].filter(Boolean).join(' ') || 'Sin nombre') : undefined}
        size="md"
        actions={
          <div className="flex gap-2">
            {viewing?.status === 'ACTIVE' && (
              <Button
                variant="destructive"
                size="md"
                onClick={() => {
                  setUnsubscribing(viewing);
                  setViewing(null);
                }}
              >
                <UserX className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Dar de baja
              </Button>
            )}
            <Button variant="outline" size="md" onClick={() => setViewing(null)}>
              Cerrar
            </Button>
          </div>
        }
      >
        {viewing && (
          <dl className="space-y-3">
            <DetailRow label="Nombre completo" value={[viewing.firstName, viewing.lastName].filter(Boolean).join(' ') || '—'} />
            <DetailRow label="Correo electrónico" value={viewing.email ?? '—'} />
            <DetailRow label="Celular / WhatsApp" value={viewing.phone ?? '—'} />
            <DetailRow label="Iglesia" value={viewing.church ?? '—'} />
            <DetailRow label="País" value={viewing.country ?? '—'} />
            <DetailRow
              label="Estado"
              value={<Badge variant={STATUS_LABELS[viewing.status]?.variant ?? 'outline'} size="sm">{STATUS_LABELS[viewing.status]?.label ?? viewing.status}</Badge>}
            />
            <DetailRow label="Suscrito desde" value={formatDate(viewing.subscribedAt)} />
            <DetailRow label="Fecha de baja" value={viewing.unsubscribedAt ? formatDate(viewing.unsubscribedAt) : '—'} />
            <DetailRow label="Cuenta vinculada" value={viewing.userId ? 'Sí (usuario registrado)' : 'No'} />
          </dl>
        )}
      </Modal>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
      <dt className="w-40 shrink-0 text-caption font-semibold uppercase tracking-wide text-dark-500 dark:text-dark-400">
        {label}
      </dt>
      <dd className="text-body-sm text-dark-900 dark:text-dark-100">{value}</dd>
    </div>
  );
}