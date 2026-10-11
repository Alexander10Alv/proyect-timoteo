'use client';

import * as React from 'react';
import { cn, formatCurrency } from '@/lib/utils';
import { Button, Card, Input, Select } from '@/components/ui';
import { CreditCard, Heart, ShieldCheck } from 'lucide-react';
import type { JoshuaProjectCountry } from '@/types';
import { isValidEmail, generateId } from '@/lib/utils';
import { useAppStore } from '@/store';

const PRESET_AMOUNTS = [25, 50, 100, 250];

interface DonationFormProps {
  countries: JoshuaProjectCountry[];
  preselectedCountryId?: string;
}

export function DonationForm({ countries, preselectedCountryId }: DonationFormProps) {
  const { addDonation, openLoginModal } = useAppStore();
  
  const [donorName, setDonorName] = React.useState('');
  const [donorEmail, setDonorEmail] = React.useState('');
  const [amount, setAmount] = React.useState<number>(50);
  const [customAmount, setCustomAmount] = React.useState('');
  const [currency, setCurrency] = React.useState('USD');
  const [targetCountryId, setTargetCountryId] = React.useState(preselectedCountryId ?? '');
  const [paymentMethod, setPaymentMethod] = React.useState<'card' | 'paypal'>('card');
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitted, setSubmitted] = React.useState(false);

  const countryOptions = React.useMemo(
    () => [
      { value: '', label: 'Dónde más se necesite (General)' },
      ...countries.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` })),
    ],
    [countries]
  );

  const handlePreset = (value: number) => {
    setAmount(value);
    setCustomAmount('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!donorName.trim()) nextErrors.donorName = 'El nombre es requerido';
    if (!isValidEmail(donorEmail)) nextErrors.donorEmail = 'Correo electrónico inválido';

    const finalAmount = customAmount ? parseFloat(customAmount) : amount;
    if (!finalAmount || finalAmount < 1) nextErrors.amount = 'El monto mínimo es $1.00';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    addDonation({
      donorName: donorName.trim(),
      donorEmail: donorEmail.trim(),
      amount: finalAmount,
      currency,
      targetCountryId: targetCountryId || undefined,
      status: 'COMPLETED',
    });

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Card padding="lg" className="mx-auto max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <ShieldCheck className="h-8 w-8 text-green-600 dark:text-green-400" aria-hidden="true" />
        </div>
        <h2 className="font-serif text-heading-xl font-semibold text-dark-900 dark:text-dark-100">
          ¡Gracias por tu generosidad!
        </h2>
        <p className="mt-3 text-body-md text-dark-500 dark:text-dark-400">
          Tu donación de <strong>{formatCurrency(customAmount ? parseFloat(customAmount) : amount, currency)}</strong> fue
          registrada correctamente (simulación de demostración).
        </p>
        <Button variant="outline" className="mt-8" onClick={() => { setSubmitted(false); setDonorName(''); setDonorEmail(''); }}>
          Realizar otra donación
        </Button>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {/* Monto */}
      <fieldset>
        <legend className="mb-4 font-serif text-heading-lg font-semibold text-dark-900 dark:text-dark-100">
          Monto de la donación
        </legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PRESET_AMOUNTS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handlePreset(preset)}
              aria-pressed={amount === preset && !customAmount}
              className={cn(
                'rounded-lg border py-3 text-center transition-colors',
                amount === preset && !customAmount
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'border-dark-200 dark:border-dark-700 text-dark-600 dark:text-dark-300 hover:border-primary-300 dark:hover:border-primary-700'
              )}
            >
              <span className="font-serif text-heading-md font-semibold">${preset}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_160px]">
          <Input
            label="Monto personalizado"
            type="number"
            min={1}
            step="0.01"
            placeholder="Ej. 75.00"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            error={errors.amount}
          />
          <Select
            label="Moneda"
            options={[
              { value: 'USD', label: 'USD — Dólar' },
              { value: 'EUR', label: 'EUR — Euro' },
              { value: 'PEN', label: 'PEN — Sol' },
              { value: 'MXN', label: 'MXN — Peso MX' },
            ]}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          />
        </div>
      </fieldset>

      {/* Destino */}
      <Select
        label="Destino de tu donación"
        options={countryOptions}
        value={targetCountryId}
        onChange={(e) => setTargetCountryId(e.target.value)}
        helperText="Puedes dirigir tu ofrenda a un país específico o dejar que se use donde más se necesite."
      />

      {/* Datos del donante */}
      <fieldset className="space-y-4">
        <legend className="mb-4 font-serif text-heading-lg font-semibold text-dark-900 dark:text-dark-100">
          Tus datos
        </legend>
        <Input
          label="Nombre completo"
          required
          placeholder="Tu nombre"
          value={donorName}
          onChange={(e) => setDonorName(e.target.value)}
          error={errors.donorName}
        />
        <Input
          label="Correo electrónico"
          required
          type="email"
          placeholder="tu@correo.com"
          value={donorEmail}
          onChange={(e) => setDonorEmail(e.target.value)}
          error={errors.donorEmail}
        />
      </fieldset>

      {/* Método de pago */}
      <fieldset>
        <legend className="mb-4 font-serif text-heading-lg font-semibold text-dark-900 dark:text-dark-100">
          Método de pago
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPaymentMethod('card')}
            aria-pressed={paymentMethod === 'card'}
            className={cn(
              'flex items-center justify-center gap-2 rounded-lg border px-4 py-4 transition-colors',
              paymentMethod === 'card'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'border-dark-200 dark:border-dark-700 text-dark-600 dark:text-dark-300 hover:border-primary-300'
            )}
          >
            <CreditCard className="h-5 w-5" aria-hidden="true" />
            Tarjeta de crédito
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('paypal')}
            aria-pressed={paymentMethod === 'paypal'}
            className={cn(
              'flex items-center justify-center gap-2 rounded-lg border px-4 py-4 transition-colors',
              paymentMethod === 'paypal'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'border-dark-200 dark:border-dark-700 text-dark-600 dark:text-dark-300 hover:border-primary-300'
            )}
          >
            <Heart className="h-5 w-5" aria-hidden="true" />
            PayPal
          </button>
        </div>

        {paymentMethod === 'card' && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 animate-fade-in">
            <div className="sm:col-span-2">
              <Input label="Número de tarjeta" placeholder="4242 4242 4242 4242" inputMode="numeric" maxLength={19} />
            </div>
            <Input label="Vencimiento" placeholder="MM / AA" maxLength={7} />
            <Input label="CVC" placeholder="123" inputMode="numeric" maxLength={4} />
          </div>
        )}

        {paymentMethod === 'paypal' && (
          <p className="mt-5 rounded-lg bg-blue-50 dark:bg-blue-900/20 px-4 py-3 text-body-sm text-blue-700 dark:text-blue-300 animate-fade-in">
            Al confirmar, serás redirigido a PayPal para completar la donación de forma segura.
          </p>
        )}
      </fieldset>

      <Button type="submit" size="xl" className="w-full">
        Donar {formatCurrency(customAmount ? parseFloat(customAmount) || 0 : amount, currency)}
      </Button>

      <p className="flex items-center justify-center gap-2 text-caption text-dark-400 dark:text-dark-500">
        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        Transacción simulada para fines de demostración. Ninguna tarjeta será cobrada.
      </p>
    </form>
  );
}