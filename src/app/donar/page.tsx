'use client';

import { useAppStore } from '@/store';
import { DonationForm } from '@/components/donations/DonationForm';

export default function DonarPage() {
  const countries = useAppStore((s) => s.countries);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <header className="mb-12 text-center">
        <p className="text-caption uppercase tracking-[0.25em] text-primary-600 dark:text-primary-400">
          Donaciones
        </p>
        <h1 className="mt-3 font-serif text-display-lg font-semibold text-dark-900 dark:text-dark-100">
          Invierte en el Reino
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-body-lg text-dark-500 dark:text-dark-400">
          Cada contribución sostiene misioneros en el campo, traducción de recursos y formación
          de obreros entre los pueblos no alcanzados.
        </p>
      </header>

      <DonationForm countries={countries} />
    </div>
  );
}