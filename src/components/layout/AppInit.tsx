'use client';

import * as React from 'react';
import { useAppStore } from '@/store';
import { useSiteStore } from '@/store/siteStore';

/**
 * Inicialización global del lado del cliente: carga los datos que el resto
 * de la app espera del store (p. ej. países) una sola vez al montar la app.
 */
export function AppInit({ children }: { children: React.ReactNode }) {
  const countries = useAppStore((s) => s.countries);
  const countriesLoading = useAppStore((s) => s.countriesLoading);
  const fetchCountries = useAppStore((s) => s.fetchCountries);
  const fetchSite = useSiteStore((s) => s.fetchSite);

  React.useEffect(() => {
    if (countries.length === 0 && !countriesLoading) void fetchCountries();
    void fetchSite();
  }, [countries.length, countriesLoading, fetchCountries, fetchSite]);

  return <>{children}</>;
}