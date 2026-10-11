'use client';

import * as React from 'react';
import { useAppStore } from '@/store';
import { Button, Card, Select, Badge } from '@/components/ui';
import { exportToCsv, formatCurrency, formatDate } from '@/lib/utils';
import { Download, Filter, HeartHandshake } from 'lucide-react';

const GENERAL_FUND = '__general__';

interface DonationFilters {
  countryId: string;
  fromDate: string;
  toDate: string;
  minAmount: string;
  maxAmount: string;
  status: string;
}

const EMPTY_FILTERS: DonationFilters = {
  countryId: '',
  fromDate: '',
  toDate: '',
  minAmount: '',
  maxAmount: '',
  status: '',
};

export function DonationsTable() {
  const donations = useAppStore((s) => s.donations);
  const countries = useAppStore((s) => s.countries);
  const [filters, setFilters] = React.useState<DonationFilters>(EMPTY_FILTERS);

  const filtered = React.useMemo(() => {
    return donations.filter((d) => {
      // Filtro por país (incluye centinela para "fondo general")
      if (filters.countryId) {
        if (filters.countryId === GENERAL_FUND && d.targetCountryId) return false;
        if (filters.countryId !== GENERAL_FUND && d.targetCountryId !== filters.countryId) return false;
      }

      if (filters.status && d.status !== filters.status) return false;

      const created = new Date(d.createdAt);
      if (filters.fromDate) {
        const from = new Date(filters.fromDate);
        from.setHours(0, 0, 0, 0);
        if (created < from) return false;
      }
      if (filters.toDate) {
        const to = new Date(filters.toDate);
        to.setHours(23, 59, 59, 999);
        if (created > to) return false;
      }

      if (filters.minAmount && d.amount < Number(filters.minAmount)) return false;
      if (filters.maxAmount && d.amount > Number(filters.maxAmount)) return false;

      return true;
    });
  }, [donations, filters]);

  const totals = React.useMemo(() => {
    const byCurrency = new Map<string, number>();
    filtered.forEach((d) => {
      byCurrency.set(d.currency, (byCurrency.get(d.currency) ?? 0) + d.amount);
    });
    return Array.from(byCurrency.entries());
  }, [filtered]);

  const handleExport = () => {
    exportToCsv(
      `donaciones-heartcry-${new Date().toISOString().slice(0, 10)}`,
      ['Fecha', 'Donante', 'Email', 'Monto', 'Moneda', 'País destino', 'Estado'],
      filtered.map((d) => {
        const country = countries.find((c) => c.id === d.targetCountryId);
        return [
          new Date(d.createdAt).toLocaleString('es-ES'),
          d.donorName,
          d.donorEmail,
          d.amount.toFixed(2),
          d.currency,
          country ? `${country.name} (${country.code})` : 'Fondo general',
          d.status,
        ];
      })
    );
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-heading-lg font-semibold text-dark-900 dark:text-dark-100">
            Historial de Donaciones
          </h2>
          <p className="text-body-sm text-dark-500 dark:text-dark-400">
            {donations.length} donaciones registradas en el sistema · {filtered.length} visibles con filtros
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={filtered.length === 0}>
          <Download className="mr-2 h-4 w-4" aria-hidden="true" />
          Exportar reporte CSV
        </Button>
      </div>

      {/* Filtros */}
      <Card padding="md">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary-500" aria-hidden="true" />
          <h3 className="text-body-sm font-semibold uppercase tracking-wide text-dark-500 dark:text-dark-400">
            Filtros
          </h3>
          {hasActiveFilters && (
            <button
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="ml-auto text-caption font-medium text-primary-600 hover:underline dark:text-primary-400"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Select
            label="País destino"
            options={[
              { value: '', label: 'Todos' },
              { value: GENERAL_FUND, label: 'Fondo general' },
              ...countries.map((c) => ({ value: c.id, label: c.name })),
            ]}
            value={filters.countryId}
            onChange={(e) => setFilters({ ...filters, countryId: e.target.value })}
          />

          <label className="block w-full">
            <span className="mb-1.5 block text-sm font-medium text-dark-700 dark:text-dark-300">Desde</span>
            <input
              type="date"
              aria-label="Fecha desde"
              value={filters.fromDate}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
              className="w-full rounded-lg border border-dark-300 bg-white px-3 py-2.5 text-body-sm focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-dark-600 dark:bg-dark-900 dark:text-dark-100"
            />
          </label>

          <label className="block w-full">
            <span className="mb-1.5 block text-sm font-medium text-dark-700 dark:text-dark-300">Hasta</span>
            <input
              type="date"
              aria-label="Fecha hasta"
              value={filters.toDate}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
              className="w-full rounded-lg border border-dark-300 bg-white px-3 py-2.5 text-body-sm focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-dark-600 dark:bg-dark-900 dark:text-dark-100"
            />
          </label>

          <label className="block w-full">
            <span className="mb-1.5 block text-sm font-medium text-dark-700 dark:text-dark-300">Monto mín.</span>
            <input
              type="number"
              min={0}
              placeholder="0"
              aria-label="Monto mínimo"
              value={filters.minAmount}
              onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
              className="w-full rounded-lg border border-dark-300 bg-white px-3 py-2.5 text-body-sm focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-dark-600 dark:bg-dark-900 dark:text-dark-100"
            />
          </label>

          <label className="block w-full">
            <span className="mb-1.5 block text-sm font-medium text-dark-700 dark:text-dark-300">Monto máx.</span>
            <input
              type="number"
              min={0}
              placeholder="Sin límite"
              aria-label="Monto máximo"
              value={filters.maxAmount}
              onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
              className="w-full rounded-lg border border-dark-300 bg-white px-3 py-2.5 text-body-sm focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-dark-600 dark:bg-dark-900 dark:text-dark-100"
            />
          </label>

          <Select
            label="Estado"
            options={[
              { value: '', label: 'Todos' },
              { value: 'COMPLETED', label: 'Completada' },
              { value: 'PENDING', label: 'Pendiente' },
              { value: 'FAILED', label: 'Fallida' },
              { value: 'REFUNDED', label: 'Reembolsada' },
            ]}
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          />
        </div>

        {totals.length > 0 && (
          <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-dark-100 pt-4 text-body-sm font-medium text-dark-700 dark:border-dark-800 dark:text-dark-300">
            Total visible:
            {totals.map(([cur, sum]) => (
              <span key={cur} className="font-mono text-primary-600 dark:text-primary-400">
                {formatCurrency(sum, cur)}
              </span>
            ))}
          </p>
        )}
      </Card>

      {/* Tabla */}
      <Card padding="none" className="overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <HeartHandshake className="mx-auto mb-4 h-12 w-12 text-dark-300 dark:text-dark-600" aria-hidden="true" />
            <h3 className="font-serif text-heading-md font-semibold text-dark-900 dark:text-dark-100">
              No hay donaciones que mostrar
            </h3>
            <p className="mt-1 text-body-sm text-dark-500 dark:text-dark-400">
              Las donaciones realizadas en la plataforma aparecerán aquí. Prueba el formulario en «/donar».
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-dark-200 dark:border-dark-700 bg-dark-50 dark:bg-dark-800/50">
                {['Fecha', 'Donante', 'Email', 'Monto', 'País destino', 'Estado'].map((th) => (
                  <th key={th} scope="col" className="whitespace-nowrap px-5 py-3 text-caption font-semibold uppercase tracking-wide text-dark-500 dark:text-dark-400">
                    {th}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => {
                const country = countries.find((c) => c.id === d.targetCountryId);
                return (
                  <tr key={d.id} className="border-b border-dark-100 last:border-0 hover:bg-dark-50/60 dark:border-dark-800 dark:hover:bg-dark-800/40">
                    <td className="whitespace-nowrap px-5 py-4 text-body-sm text-dark-500 dark:text-dark-400">
                      {formatDate(d.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-body-sm font-medium text-dark-900 dark:text-dark-100">{d.donorName}</td>
                    <td className="px-5 py-4 text-body-sm text-dark-500 dark:text-dark-400">{d.donorEmail}</td>
                    <td className="whitespace-nowrap px-5 py-4 font-mono text-body-sm font-semibold text-dark-900 dark:text-dark-100">
                      {formatCurrency(d.amount, d.currency)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-body-sm text-dark-600 dark:text-dark-300">
                      {country ? `${country.name} (${country.code})` : 'Fondo general'}
                    </td>
                    <td className="px-5 py-4">
                      <DonationStatusBadge status={d.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

export function DonationStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'default' }> = {
    COMPLETED: { label: 'Completada', variant: 'success' },
    PENDING: { label: 'Pendiente', variant: 'warning' },
    FAILED: { label: 'Fallida', variant: 'danger' },
    REFUNDED: { label: 'Reembolsada', variant: 'default' },
  };
  const cfg = map[status] ?? { label: status, variant: 'default' as const };
  return <Badge variant={cfg.variant} size="sm">{cfg.label}</Badge>;
}