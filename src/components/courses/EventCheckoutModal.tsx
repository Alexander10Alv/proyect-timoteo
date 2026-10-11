'use client';

import * as React from 'react';
import { Modal, Button, Input } from '@/components/ui';
import type { Course, CoursePurchase } from '@/types';
import { CreditCard, Heart, ShieldCheck, CheckCircle2, Clock3 } from 'lucide-react';

interface Props {
  course: Course;
  onClose: () => void;
  onSuccess: (purchase: CoursePurchase, enrolledCourses: string[]) => void;
}

const PEN_FIELDS = { number: 'Número de tarjeta', expiry: 'Vencimiento', cvc: 'CVC' } as const;

export function EventCheckoutModal({ course, onClose, onSuccess }: Props) {
  const hasPEN = course.pricePEN != null && course.pricePEN > 0;
  const hasUSD = course.priceUSD != null && course.priceUSD > 0;
  const currencyOptions: Array<{ value: 'PEN' | 'USD'; label: string }> = [];
  if (hasUSD) currencyOptions.push({ value: 'USD', label: `Dólares (US$ ${course.priceUSD})` });
  if (hasPEN) currencyOptions.push({ value: 'PEN', label: `Soles (S/ ${course.pricePEN})` });
  const isFree = currencyOptions.length === 0;

  const [currency, setCurrency] = React.useState<'PEN' | 'USD'>('PEN');
  const [preferred, setPreferred] = React.useState<string | null>(null);
  const [method, setMethod] = React.useState<'card' | 'paypal'>('card');
  const [card, setCard] = React.useState({ number: '', expiry: '', cvc: '' });
  const [error, setError] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [done, setDone] = React.useState<CoursePurchase | null>(null);

  React.useEffect(() => {
    if (!preferred) {
      const fallback: 'PEN' | 'USD' = currencyOptions.find((c) => c.value === 'PEN')?.value ?? 'USD';
      setPreferred(fallback);
      setCurrency(fallback);
    }
  }, [course.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const amount = currency === 'PEN' ? course.pricePEN : course.priceUSD;

  const pickCurrency = (value: 'PEN' | 'USD') => {
    setCurrency(value);
    setPreferred(value);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isFree) {
      await doPOST({});
      return;
    }

    if (amount == null) {
      setError('Este evento no tiene precio en la moneda elegida.');
      return;
    }

    if (method === 'card') {
      if (!/^\d{13,19}$/.test(card.number.replace(/\s/g, ''))) {
        setError('Número de tarjeta inválido.');
        return;
      }
      if (!/^\d{2}\s*\/\s*\d{2}$/.test(card.expiry)) {
        setError('Vencimiento inválido (MM/AA).');
        return;
      }
      if (!/^\d{3,4}$/.test(card.cvc)) {
        setError('CVC inválido.');
        return;
      }
    }

    await doPOST({
      currency,
      method: method === 'card' ? 'CARD' : 'PAYPAL',
      card: method === 'card' ? card : undefined,
    });
  };

  const doPOST = async (body: Record<string, unknown>) => {
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/courses/${course.id}/purchases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as { purchase?: CoursePurchase; enrolledCourses?: string[]; error?: string };
      if (!response.ok || !data.purchase) {
        setError(data.error ?? 'No se pudo completar la inscripción.');
        return;
      }
      setDone(data.purchase);
      onSuccess(data.purchase, data.enrolledCourses ?? []);
    } catch {
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const doneState = (done: CoursePurchase) => (
    <div className="py-6 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
        <CheckCircle2 className="h-9 w-9 text-green-600 dark:text-green-400" aria-hidden="true" />
      </div>
      <h3 className="font-serif text-heading-lg font-semibold text-dark-900 dark:text-dark-100">¡Inscripción confirmada!</h3>
      <p className="mt-2 text-body-md text-dark-500 dark:text-dark-400">
        {done.method === 'FREE'
          ? 'Te has inscrito gratis.'
          : `Pagaste ${done.currency === 'USD' ? `US$ ${done.amount}` : `S/ ${done.amount}`} · ${done.method === 'MANUAL' ? 'manual' : done.method === 'PAYPAL' ? 'PayPal' : 'Tarjeta'}.`}
      </p>
      {done.transactionId && (
        <p className="mt-1 flex items-center justify-center gap-1.5 text-caption text-dark-400 dark:text-dark-500">
          <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
          Referencia: {done.transactionId}
        </p>
      )}
      <p className="mt-2 text-caption text-dark-400 dark:text-dark-500">Ya puedes acceder al enlace de reunión / grabación de este evento.</p>
      <Button className="mt-6" onClick={onClose}>
        Cerrar
      </Button>
    </div>
  );

  return (
    <Modal isOpen onClose={onClose} title={`Inscripción · ${course.title}`} description={isFree ? 'Evento gratuito' : 'Pago simulado para demostración. Ninguna tarjeta será cobrada.'}>
      {done ? (
        doneState(done)
      ) : (
        <form onSubmit={submit} className="space-y-6" noValidate>
          {/* Moneda — solo si hay pago */}
          {!isFree && (
            <fieldset>
              <legend className="mb-3 font-serif text-heading-md font-semibold text-dark-900 dark:text-dark-100">¿En qué moneda pagas?</legend>
              <div className="grid grid-cols-2 gap-3">
                {(currencyOptions.length > 1 ? currencyOptions : [currencyOptions[0]]).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => pickCurrency(opt.value as 'PEN' | 'USD')}
                    aria-pressed={preferred === opt.value}
                    className={
                      preferred === opt.value
                        ? 'rounded-lg border-2 border-primary-500 bg-primary-50 px-4 py-4 text-body-sm font-semibold text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                        : 'rounded-lg border border-dark-200 px-4 py-4 text-body-sm text-dark-600 transition hover:border-primary-300 dark:border-dark-700 dark:text-dark-300'
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {/* Método de pago */}
          {!isFree && (
            <fieldset>
              <legend className="mb-3 font-serif text-heading-md font-semibold text-dark-900 dark:text-dark-100">Método de pago</legend>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMethod('card')}
                  aria-pressed={method === 'card'}
                  className={
                    method === 'card'
                      ? 'flex items-center justify-center gap-2 rounded-lg border-2 border-primary-500 bg-primary-50 px-4 py-4 text-body-sm font-semibold text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                      : 'flex items-center justify-center gap-2 rounded-lg border border-dark-200 px-4 py-4 text-body-sm text-dark-600 transition hover:border-primary-300 dark:border-dark-700 dark:text-dark-300'
                  }
                >
                  <CreditCard className="h-5 w-5" aria-hidden="true" />
                  Tarjeta
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('paypal')}
                  aria-pressed={method === 'paypal'}
                  className={
                    method === 'paypal'
                      ? 'flex items-center justify-center gap-2 rounded-lg border-2 border-primary-500 bg-primary-50 px-4 py-4 text-body-sm font-semibold text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                      : 'flex items-center justify-center gap-2 rounded-lg border border-dark-200 px-4 py-4 text-body-sm text-dark-600 transition hover:border-primary-300 dark:border-dark-700 dark:text-dark-300'
                  }
                >
                  <Heart className="h-5 w-5" aria-hidden="true" />
                  PayPal
                </button>
              </div>

              {method === 'card' && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 animate-fade-in">
                  <Input label={PEN_FIELDS.number} placeholder="4242 4242 4242 4242" inputMode="numeric" maxLength={19} value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label={PEN_FIELDS.expiry} placeholder="MM / AA" maxLength={7} value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} />
                    <Input label={PEN_FIELDS.cvc} placeholder="123" inputMode="numeric" maxLength={4} value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value })} />
                  </div>
                </div>
              )}

              {method === 'paypal' && (
                <p className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-body-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 animate-fade-in">
                  Al confirmar, la pasarela simulará el pago por PayPal.
                </p>
              )}
            </fieldset>
          )}

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-body-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </p>
          )}

          <Button type="submit" size="xl" className="w-full" loading={saving}>
            {isFree ? 'Confirmar inscripción gratis' : `Inscribirme y pagar ${currency === 'USD' ? `US$ ${course.priceUSD}` : `S/ ${course.pricePEN}`}`}
          </Button>

          {!isFree && (
            <p className="flex items-center justify-center gap-2 text-caption text-dark-400 dark:text-dark-500">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Transacción simulada · ninguna tarjeta será cobrada.
            </p>
          )}
        </form>
      )}
    </Modal>
  );
}