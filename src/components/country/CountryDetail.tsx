'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { Badge, Button, Card, Progress } from '@/components/ui';
import { Users, Globe, Languages, Church, TrendingUp, HeartHandshake, ArrowLeft, Share2, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import type { JoshuaProjectCountry, JpPeopleGroup } from '@/types';
import { formatNumber, formatPercentage, formatDate } from '@/lib/utils';

const CountryMap = dynamic(
  () => import('@/components/maps/CountryMap').then((m) => m.CountryMap),
  { ssr: false, loading: () => <MapLoading /> }
);

interface CountryDetailProps {
  country: JoshuaProjectCountry;
  peopleGroups?: JpPeopleGroup[];
  onBack?: () => void;
  onDonate?: () => void;
}

export function CountryDetail({ country, peopleGroups, onBack, onDonate }: CountryDetailProps) {
  const [selectedCode, setSelectedCode] = React.useState<string | null>(null);

  const PAGE_SIZE = 40;
  const [page, setPage] = React.useState(1);

  const totalPages = peopleGroups ? Math.max(1, Math.ceil(peopleGroups.length / PAGE_SIZE)) : 1;
  const currentPage = Math.min(page, totalPages);
  const visibleGroups = peopleGroups?.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE) ?? [];

  React.useEffect(() => {
    setPage(1);
    setSelectedCode(null);
  }, [peopleGroups]);

  const scrollToGroup = (peopCode: string) => {
    const el = document.getElementById(`people-group-${peopCode}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-primary-500');
      setTimeout(() => el.classList.remove('ring-2', 'ring-primary-500'), 2000);
    }
  };

  const handleGroupClick = (peopCode: string) => {
    if (!peopleGroups) return;
    setSelectedCode(peopCode);
    const index = peopleGroups.findIndex((g) => g.peopCode === peopCode);
    if (index < 0) return;
    const targetPage = Math.floor(index / PAGE_SIZE) + 1;
    setPage(targetPage);
    setTimeout(() => scrollToGroup(peopCode), 60);
  };

  const hasCoordinates = React.useMemo(
    () => (peopleGroups ?? []).some((g) => g.latitude != null && g.longitude != null),
    [peopleGroups]
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver al mapa
        </Button>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" aria-hidden="true" />
          Compartir
        </Button>
      </div>

      {country.heroImage && (
        <div className="overflow-hidden rounded-2xl border border-dark-200 dark:border-dark-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={country.heroImage}
            alt={`Vista de ${country.name}`}
            className="h-64 w-full object-cover sm:h-80"
            loading="lazy"
          />
        </div>
      )}

      <header className="flex items-start justify-between gap-4 border-b border-dark-200 dark:border-dark-700 pb-8">
        <div>
          <p className="text-caption uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 mb-2">
            Perfil del país · Joshua Project
          </p>
          <h1 className="font-serif text-display-md font-semibold text-dark-900 dark:text-dark-100">
            {country.name}
          </h1>
          <p className="mt-3 max-w-prose text-body-lg text-dark-500 dark:text-dark-400">
            {country.overviewText}
          </p>
        </div>
        {country.flagUrl && (
          <div className="shrink-0 overflow-hidden rounded-lg border border-dark-200 dark:border-dark-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={country.flagUrl}
              alt={`Bandera de ${country.name}`}
              className="h-12 w-16 object-cover sm:h-14 sm:w-20"
              loading="lazy"
            />
          </div>
        )}
      </header>

      <section aria-label="Indicadores clave" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Población total" value={formatNumber(country.totalPopulation)} />
        <StatCard icon={Globe} label="Grupos étnicos" value={String(country.ethnicGroupsCount)} accent />
        <StatCard icon={HeartHandshake} label="Grupos no alcanzados" value={String(country.unreachedGroups)} danger />
        <StatCard icon={Languages} label="Idioma principal" value={country.primaryLanguage} />
      </section>

      <section aria-label="Progreso del evangelio" className="grid gap-6 lg:grid-cols-2">
        <Card padding="lg">
          <h2 className="font-serif text-heading-xl font-semibold text-dark-900 dark:text-dark-100 mb-6">
            Progreso del Evangelio
          </h2>
          <Progress value={country.progressBarValue} size="lg" showLabel label={`Evangelización: ${Math.round(country.progressBarValue)}%`} />
          <div className="mt-8 space-y-5">
            <PercentageRow icon={Church} label="Cristianos" value={country.christianPercentage} colorClass="bg-primary-500" />
            <PercentageRow icon={TrendingUp} label="Evangélicos" value={country.evangelicalPercentage} colorClass="bg-gold-500" />
          </div>
        </Card>

        <Card padding="lg">
          <h2 className="font-serif text-heading-xl font-semibold text-dark-900 dark:text-dark-100 mb-6">
            Contexto Religioso
          </h2>
          <dl className="space-y-4">
            <div className="flex items-start justify-between gap-4 py-3 border-b border-dark-100 dark:border-dark-800">
              <dt className="text-body-sm font-medium text-dark-500 dark:text-dark-400">Religión principal</dt>
              <dd><Badge variant="primary">{country.primaryReligion}</Badge></dd>
            </div>
            <div className="flex items-start justify-between gap-4 py-3 border-b border-dark-100 dark:border-dark-800">
              <dt className="text-body-sm font-medium text-dark-500 dark:text-dark-400">Idioma principal</dt>
              <dd className="text-body-sm font-medium text-dark-900 dark:text-dark-100">{country.primaryLanguage}</dd>
            </div>
            <div className="flex items-start justify-between gap-4 py-3 border-b border-dark-100 dark:border-dark-800">
              <dt className="text-body-sm font-medium text-dark-500 dark:text-dark-400">Código del país</dt>
              <dd className="font-mono text-body-sm font-semibold text-primary-600 dark:text-primary-400">{country.code}</dd>
            </div>
            <div className="flex items-start justify-between gap-4 py-3">
              <dt className="text-body-sm font-medium text-dark-500 dark:text-dark-400">Donaciones recibidas</dt>
              <dd className="text-body-sm font-semibold text-dark-900 dark:text-dark-100">
                ${formatNumber(country.totalDonations ?? 0)} · {country.donationCount ?? 0}
              </dd>
            </div>
          </dl>

          {onDonate && (
            <Button size="lg" className="w-full mt-8" onClick={onDonate}>
              Donar para este país
            </Button>
          )}
        </Card>
      </section>

      {hasCoordinates && (
        <section aria-label="Mapa de grupos étnicos" className="mt-4">
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary-600 dark:text-primary-400" aria-hidden="true" />
            <h2 className="font-serif text-heading-xl font-semibold text-dark-900 dark:text-dark-100">
              Mapa de grupos étnicos
            </h2>
          </div>
          <p className="mb-5 max-w-prose text-body-md text-dark-500 dark:text-dark-400">
            Ubicación geográfica de cada grupo étnico. Haz clic en un marcador para verlo en la lista.
            El color indica el Progress Scale (JPScale).
          </p>
          {peopleGroups !== undefined && peopleGroups.length > 0 && (
            <CountryMap peopleGroups={peopleGroups} onGroupClick={handleGroupClick} />
          )}
        </section>
      )}

      <section aria-label="Grupos étnicos" className="mt-4">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-heading-xl font-semibold text-dark-900 dark:text-dark-100">
              Grupos étnicos
            </h2>
            <p className="mt-1 text-body-md text-dark-500 dark:text-dark-400">
              Pueblos no alcanzados y alcanzados que conforman {country.name}.
            </p>
          </div>
          {peopleGroups !== undefined && (
            <span className="shrink-0 rounded-full bg-dark-100 px-3 py-1 text-caption font-medium text-dark-600 dark:bg-dark-800 dark:text-dark-300">
              {peopleGroups.length} {peopleGroups.length === 1 ? 'grupo' : 'grupos'}
            </span>
          )}
        </div>

        {peopleGroups === undefined && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-xl bg-dark-200 dark:bg-dark-700" />
            ))}
          </div>
        )}

        {peopleGroups !== undefined && peopleGroups.length === 0 && (
          <p className="rounded-xl border border-dashed border-dark-200 px-4 py-10 text-center text-body-md text-dark-500 dark:border-dark-700 dark:text-dark-400">
            Aún no hay grupos étnicos registrados para este país.
          </p>
        )}

        {peopleGroups !== undefined && peopleGroups.length > 0 && (
          <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleGroups.map((g) => (
              <article
                key={g.id}
                id={`people-group-${g.peopCode}`}
                className="overflow-hidden rounded-xl border border-dark-200 bg-white dark:border-dark-700 dark:bg-dark-900"
              >
                <div className="flex items-center gap-4 p-4">
                  {g.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={g.photoUrl}
                      alt={g.peopleName}
                      className="h-16 w-16 shrink-0 rounded-lg object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-dark-100 dark:bg-dark-800">
                      <Users className="h-6 w-6 text-dark-400" aria-hidden="true" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <h3 className="truncate font-serif text-heading-sm font-semibold text-dark-900 dark:text-dark-100">
                      {g.peopleName}
                    </h3>
                    <p className="truncate text-caption text-dark-500 dark:text-dark-400">
                      {formatNumber(g.populationInCountry)} hab. · {g.primaryLanguage}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 px-4 pb-3">
                  {g.isUnreached && <Badge variant="danger" size="sm">No alcanzado</Badge>}
                  {g.isIndigenous && <Badge variant="primary" size="sm">Indígena</Badge>}
                  {g.isFrontier && <Badge variant="warning" size="sm">Frontera</Badge>}
                  {g.isDiaspora && <Badge variant="default" size="sm">Diáspora</Badge>}
                </div>

                <dl className="grid grid-cols-2 gap-px border-t border-dark-100 bg-dark-100 dark:border-dark-800 dark:bg-dark-800">
                  <div className="bg-white p-3 dark:bg-dark-900">
                    <dt className="text-caption text-dark-500 dark:text-dark-400">Progress Scale</dt>
                    <dd className="font-mono text-sm font-semibold text-dark-900 dark:text-dark-100">
                      {g.progressScale != null ? g.progressScale.toFixed(1) : '—'}
                    </dd>
                  </div>
                  <div className="bg-white p-3 dark:bg-dark-900">
                    <dt className="text-caption text-dark-500 dark:text-dark-400">Obreros necesarios</dt>
                    <dd className="font-mono text-sm font-semibold text-dark-900 dark:text-dark-100">
                      {g.workersNeeded != null ? formatNumber(g.workersNeeded) : '—'}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-body-sm text-dark-500 dark:text-dark-400">
                Mostrando {(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, peopleGroups.length)} de {peopleGroups.length} grupos
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  Anterior
                </Button>
                <span className="px-2 text-body-sm font-medium text-dark-700 dark:text-dark-300">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          )}
          </>
        )}
      </section>
    </div>
  );
}

function MapLoading() {
  return (
    <div className="flex h-[400px] items-center justify-center rounded-xl border border-dark-200 bg-dark-100 dark:border-dark-700 dark:bg-dark-800">
      <span className="text-body-md text-dark-500 dark:text-dark-400">Cargando mapa…</span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent, danger }: {
  icon: React.ElementType; label: string; value: string; accent?: boolean; danger?: boolean;
}) {
  return (
    <Card padding="md" className="flex items-center gap-4">
      <div className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
        accent ? 'bg-primary-100 dark:bg-primary-900/30' : danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-dark-100 dark:bg-dark-800'
      )}>
        <Icon className={cn('h-5 w-5', danger ? 'text-red-600 dark:text-red-400' : accent ? 'text-primary-600 dark:text-primary-400' : 'text-dark-600 dark:text-dark-300')} aria-hidden="true" />
      </div>
      <div>
        <p className="text-caption uppercase tracking-wide text-dark-500 dark:text-dark-400">{label}</p>
        <p className="font-serif text-heading-lg font-semibold text-dark-900 dark:text-dark-100">{value}</p>
      </div>
    </Card>
  );
}

function PercentageRow({ icon: Icon, label, value, colorClass }: {
  icon: React.ElementType; label: string; value: number; colorClass: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-2 text-body-sm font-medium text-dark-700 dark:text-dark-300">
          <Icon className="h-4 w-4 text-dark-400" aria-hidden="true" />
          {label}
        </span>
        <span className="font-mono text-body-sm font-semibold text-dark-900 dark:text-dark-100">
          {formatPercentage(value)}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-dark-200 dark:bg-dark-700">
        <div className={cn('h-full rounded-full', colorClass)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}