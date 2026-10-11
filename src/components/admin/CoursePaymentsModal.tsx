'use client';

import * as React from 'react';
import { Modal, Input, Select, Button, Badge } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import type { Course, CoursePurchase, PurchaseMethod, PurchaseStatus } from '@/types';
import { RefreshCw, Banknote, UserCheck, Users, X } from 'lucide-react';

interface Props {
  course: Course;
  onClose: () => void;
}

const METHOD_LABELS: Record<string, string> = {
  CARD: 'Tarjeta',
  PAYPAL: 'PayPal',
  MANUAL: 'Pago manual',
  FREE: 'Gratis',
};

const STATUS_LABELS: Record<PurchaseStatus, string> = {
  COMPLETED: 'Pagado',
  REFUNDED: 'Reembolsado',
  FAILED: 'Fallido',
};

export function CoursePaymentsModal({ course, onClose }: Props) {
  const [purchases, setPurchases] = React.useState<CoursePurchase[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [mName, setMName] = React.useState('');
  const [mEmail, setMEmail] = React.useState('');
  const [mAmount, setMAmount] = React.useState('');
  const [mCurrency, setMCurrency] = React.useState('PEN');
  const [savingManual, setSavingManual] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/courses/${course.id}/purchases`, { cache: 'no-store' });
      const data = (await response.json()) as { purchases?: CoursePurchase[]; error?: string };
      if (!response.ok || !data.purchases) {
        throw new Error(data.error ?? 'No se pudieron cargar los pagos.');
      }
      setPurchases(data.purchases.map((p) => ({ ...p, createdAt: new Date(p.createdAt), updatedAt: new Date(p.updatedAt) })));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar.');
    } finally {
      setLoading(false);
    }
  }, [course.id]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const toggleAttended = async (p: CoursePurchase) => {
    setError('');
    try {
      const response = await fetch(`/api/courses/${course.id}/purchases/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attended: !p.attended }),
      });
      const data = (await response.json()) as { purchase?: CoursePurchase; error?: string };
      if (!response.ok || !data.purchase) throw new Error(data.error ?? 'No se pudo actualizar.');
      setPurchases((list) =>
        list.map((x) => (x.id === data.purchase!.id ? { ...x, attended: data.purchase!.attended, status: data.purchase!.status } : x))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al actualizar.');
    }
  };

  const saveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const amount = parseFloat(mAmount.replace(',', '.'));
    if (!mName.trim() || !Number.isFinite(amount) || amount <= 0) {
      setError('Nombre y monto mayor a cero son requeridos.');
      return;
    }
    setSavingManual(true);
    try {
      const response = await fetch(`/api/courses/${course.id}/purchases/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: mName.trim(), email: mEmail.trim(), amount, currency: mCurrency }),
      });
      const data = (await response.json()) as { purchase?: CoursePurchase; error?: string };
      if (!response.ok || !data.purchase) throw new Error(data.error ?? 'No se pudo registrar.');
      setPurchases((list) => [{ ...data.purchase!, createdAt: new Date(data.purchase!.createdAt), updatedAt: new Date(data.purchase!.updatedAt) }, ...list]);
      setMName('');
      setMEmail('');
      setMAmount('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar el pago.');
    } finally {
      setSavingManual(false);
    }
  };

  const fmt = (amount: number, currency: string) =>
    currency === 'USD'
      ? `US$ ${amount.toFixed(2).replace(/\.00$/, '')}`
      : `S/ ${amount.toFixed(2).replace(/\.00$/, '')}`;

  const completed = purchases.filter((p) => p.status === 'COMPLETED').length;
  const capacity = course.capacity ?? null;

  return (
    <Modal isOpen onClose={onClose} title={`Pagos de «${course.title}»`} description="Lista de inscritos y pagos de este evento." size="xl">
      <div className="space-y-5">
        {/* Resumen */}
        <div className="flex flex-wrap items-center gap-3">
          {(capacity != null) && (
            <Badge variant={completed >= capacity ? 'danger' : 'primary'} size="md">
              <Users className="mr-1.5 inline h-3.5 w-3.5" aria-hidden="true" />
              {completed}/{capacity} inscritos
            </Badge>
          )}
          <Badge variant="outline" size="md">{purchases.length} registro(s)</Badge>
          <button
            type="button"
            onClick={load}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-dark-200 px-3 py-1.5 text-caption font-medium text-dark-600 transition hover:bg-dark-100 dark:border-dark-600 dark:text-dark-300 dark:hover:bg-dark-800"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Refrescar
          </button>
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-body-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </p>
        )}

        {/* Lista de pagos */}
        <div className="max-h-72 overflow-auto rounded-xl border border-dark-200 dark:border-dark-700">
          {loading ? (
            <p className="p-6 text-center text-body-sm text-dark-400">Cargando pagos…</p>
          ) : purchases.length === 0 ? (
            <p className="p-6 text-center text-body-sm text-dark-400">Aún no hay inscripciones para este evento.</p>
          ) : (
            <ul role="list" className="divide-y divide-dark-100 dark:divide-dark-800">
              {purchases.map((p) => (
                <li key={p.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-body-sm font-medium text-dark-900 dark:text-dark-100">
                      {p.name}
                      <Badge variant={p.method === 'MANUAL' ? 'warning' : p.method === 'FREE' ? 'outline' : 'success'} size="sm">
                        {METHOD_LABELS[p.method] ?? p.method}
                      </Badge>
                      <Badge variant={p.status === 'COMPLETED' ? 'success' : p.status === 'REFUNDED' ? 'warning' : 'danger'} size="sm">
                        {STATUS_LABELS[p.status]}
                      </Badge>
                    </p>
                    <p className="mt-0.5 truncate text-caption text-dark-400 dark:text-dark-500">
                      {p.email} · {fmt(p.amount, p.currency)} · {formatDate(p.createdAt)}
                      {p.transactionId ? ` · ref ${p.transactionId}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleAttended(p)}
                    aria-pressed={p.attended}
                    className={
                      p.attended
                        ? 'inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-caption font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-dark-100 px-3 py-1.5 text-caption font-medium text-dark-500 transition hover:bg-dark-200 dark:bg-dark-800 dark:text-dark-300 dark:hover:bg-dark-700'
                    }
                  >
                    <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    {p.attended ? 'Asistió ✓' : 'Marcar asistió'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pago manual (efectivo) — para presencial */}
        <form onSubmit={saveManual} className="rounded-xl border border-primary-100 bg-primary-50/40 p-4 dark:border-primary-900/40 dark:bg-primary-900/10">
          <p className="mb-2 flex items-center gap-2 text-body-sm font-semibold text-dark-800 dark:text-dark-200">
            <Banknote className="h-4 w-4 text-primary-600" aria-hidden="true" />
            Registrar pago manual (efectivo en la puerta)
          </p>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_140px_120px_auto]">
            <Input label="Nombre" value={mName} onChange={(e) => setMName(e.target.value)} placeholder="Quién pagó" required />
            <Input label="Correo (opcional)" value={mEmail} onChange={(e) => setMEmail(e.target.value)} placeholder="si lo tienes" />
            <Input label="Monto" type="number" min={0} step="0.01" value={mAmount} onChange={(e) => setMAmount(e.target.value)} placeholder="0.00" />
            <Select
              label="Moneda"
              options={[
                { value: 'PEN', label: 'S/ Soles' },
                { value: 'USD', label: 'US$ Dólares' },
              ]}
              value={mCurrency}
              onChange={(e) => setMCurrency(e.target.value)}
            />
            <div className="flex items-end">
              <Button type="submit" size="md" loading={savingManual} className="w-full">
                Guardar
              </Button>
            </div>
          </div>
        </form>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            <X className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}