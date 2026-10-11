'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store';
import { CountryList } from '@/components/map/WorldMap';
import { Input } from '@/components/ui/Input';
import type { JoshuaProjectCountry } from '@/types';
import { Search } from 'lucide-react';

/** Normaliza texto (minúsculas, sin acentos) para búsquedas flexibles. */
function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export default function PaisesPage() {
  const router = useRouter();
  const countries = useAppStore((s) => s.countries);
  const countriesLoading = useAppStore((s) => s.countriesLoading);
  const openDonationModal = useAppStore((s) => s.openDonationModal);
  const [query, setQuery] = React.useState('');
  const [selected, setSelected] = React.useState<JoshuaProjectCountry | null>(null);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return countries;
    const n = normalize(query);
    return countries.filter(
      (c) => normalize(c.name).includes(n) || normalize(c.code).includes(n)
    );
  }, [countries, query]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10">
        <p className="text-caption uppercase tracking-[0.25em] text-primary-600 dark:text-primary-400">
          Mapa Global
        </p>
        <h1 className="mt-3 font-serif text-display-lg font-semibold text-dark-900 dark:text-dark-100">
          Países y pueblos
        </h1>
        <p className="mt-4 max-w-2xl text-body-lg text-dark-500 dark:text-dark-400">
          Explora perfiles completos con estadísticas del Joshua Project: población, grupos étnicos,
          religión, idioma y progreso evangélico.
        </p>
      </header>

      <div className="mb-8 max-w-md">
        <Input
          placeholder="Buscar país por nombre o código..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar país"
        />
      </div>

      <CountryList
        countries={filtered}
        selectedCountry={selected ?? undefined}
        loading={countriesLoading}
        onSelectCountry={(c) => router.push(`/paises/${c.id}`)}
      />

      {filtered.length === 0 && (
        <p className="mt-6 text-center text-body-md text-dark-500 dark:text-dark-400">
          No se encontraron países para «{query}».
        </p>
      )}
    </div>
  );
}