'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CountryDetail } from '@/components/country/CountryDetail';
import { useAppStore } from '@/store';
import type { JpPeopleGroup } from '@/types';

/** Normaliza texto para comparaciones flexibles (minúsculas, sin acentos). */
function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function CountryPageContent({ countryId }: { countryId: string }) {
  const router = useRouter();
  const countries = useAppStore((s) => s.countries);
  const countriesLoading = useAppStore((s) => s.countriesLoading);
  const openDonationModal = useAppStore((s) => s.openDonationModal);

  const [peopleGroups, setPeopleGroups] = React.useState<JpPeopleGroup[] | null>(null);

  const target = normalize(decodeURIComponent(countryId));
  const country = countries.find(
    (c) => c.id.toLowerCase() === target || c.code.toLowerCase() === target || normalize(c.name) === target
  );

  // Trae la lista de grupos étnicos del país (foto, población, idioma, badges…).
  React.useEffect(() => {
    if (!country) return;
    setPeopleGroups(null);
    fetch(`/api/jp/countries/${country.code}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setPeopleGroups(d?.peopleGroups ?? []))
      .catch(() => setPeopleGroups([]));
  }, [country]);

  if (countriesLoading && countries.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="h-6 w-48 animate-pulse rounded bg-dark-200 dark:bg-dark-700" />
          <div className="h-10 w-96 max-w-full animate-pulse rounded bg-dark-200 dark:bg-dark-700" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-dark-200 dark:bg-dark-700" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!country) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-32 text-center">
        <p className="font-serif text-display-sm font-semibold text-dark-900 dark:text-dark-100">
          País no encontrado
        </p>
        <p className="mt-4 text-body-md text-dark-500 dark:text-dark-400">
          El perfil que buscas no existe. Regresa al mapa global para explorar los países disponibles.
        </p>
        <button
          onClick={() => router.push('/')}
          className="mt-8 rounded-lg bg-primary-600 px-6 py-3 font-medium text-white hover:bg-primary-700"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <CountryDetail
        country={country}
        peopleGroups={peopleGroups ?? undefined}
        onBack={() => router.push('/#mapa')}
        onDonate={() => openDonationModal(country.id)}
      />
    </div>
  );
}
