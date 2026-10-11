'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Badge, Progress } from '@/components/ui';
import { Reveal } from '@/components/effects/Reveal';
import type { JpCountryProfile, JoshuaProjectCountry } from '@/types';
import { formatNumber, formatPercentage } from '@/lib/utils';
import { useAppStore } from '@/store';
import { ArrowRight, Users, HeartHandshake } from 'lucide-react';

interface CountryModalProps {
  isOpen: boolean;
  onClose: () => void;
  country: JoshuaProjectCountry | null;
}

export function CountryModal({ isOpen, onClose, country }: CountryModalProps) {
  const router = useRouter();
  const openDonationModal = useAppStore((s) => s.openDonationModal);

  // Estructura completa Joshua Project: grupos de personas, provincias, ministerios.
  const [jpProfile, setJpProfile] = React.useState<JpCountryProfile | null>(null);
  const [jpLoading, setJpLoading] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen || !country) return;
    setJpProfile(null);
    setJpLoading(true);
    fetch(`/api/jp/countries/${country.code}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setJpProfile(d?.country ? (d as JpCountryProfile) : null))
      .catch(() => setJpProfile(null))
      .finally(() => setJpLoading(false));
  }, [isOpen, country]);

  if (!country) return null;

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => {
          onClose();
          router.push(`/paises/${country.id}`);
        }}
        className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-md shadow-sky-900/20 transition-colors hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-dark-900"
      >
        Ver perfil completo
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => {
          onClose();
          openDonationModal(country.id);
        }}
        className="inline-flex items-center gap-1.5 rounded-lg border-2 border-sky-500 px-4 py-2 text-sm font-medium text-sky-600 transition-colors hover:bg-sky-500/10 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-white dark:text-sky-300 dark:focus:ring-offset-dark-900"
      >
        <HeartHandshake className="h-4 w-4" aria-hidden="true" />
        Donar
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={country.name}
      description={`${country.code} · Perfil Joshua Project`}
      size="md"
      actions={headerActions}
    >
      <div className="relative space-y-6 overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-primary-400/40 to-sky-400/40 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-gradient-to-tr from-amber-300/30 to-primary-400/30 blur-3xl"
        />

        <Reveal from="top" delay={0}>
          <p className="text-body-md text-dark-600 dark:text-dark-300">
            {country.overviewText}
          </p>
        </Reveal>

        <Reveal from="bottom" delay={80}>
          <dl className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/60 bg-white/60 p-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-dark-900/60">
              <dt className="text-caption uppercase tracking-wide text-dark-500 dark:text-dark-400">Población</dt>
              <dd className="font-semibold text-dark-900 dark:text-dark-100">{formatNumber(country.totalPopulation)}</dd>
            </div>
            <div className="rounded-xl border border-white/60 bg-white/60 p-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-dark-900/60">
              <dt className="text-caption uppercase tracking-wide text-dark-500 dark:text-dark-400">No alcanzados</dt>
              <dd className="font-semibold text-red-600 dark:text-red-400">{country.unreachedGroups} grupos</dd>
            </div>
            <div className="rounded-xl border border-white/60 bg-white/60 p-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-dark-900/60">
              <dt className="text-caption uppercase tracking-wide text-dark-500 dark:text-dark-400">Religión</dt>
              <dd><Badge variant="primary">{country.primaryReligion}</Badge></dd>
            </div>
            <div className="rounded-xl border border-white/60 bg-white/60 p-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-dark-900/60">
              <dt className="text-caption uppercase tracking-wide text-dark-500 dark:text-dark-400">Evangélicos</dt>
              <dd className="font-semibold text-primary-600 dark:text-primary-400">{formatPercentage(country.evangelicalPercentage)}</dd>
            </div>
          </dl>
        </Reveal>

        <Reveal from="bottom" delay={160}>
          <Progress value={country.progressBarValue} showLabel label="Progreso del evangelio" />
        </Reveal>

        {/* Estructura completa Joshua Project */}
        {jpLoading && (
          <Reveal from="bottom" delay={240}>
            <p className="text-caption text-dark-400 dark:text-dark-500">Cargando grupos de personas…</p>
          </Reveal>
        )}

        {jpProfile && jpProfile.peopleGroups.length > 0 && (
          <Reveal from="bottom" delay={240}>
            <section aria-label="Grupos de personas">
              <h3 className="mb-2.5 font-serif text-heading-sm font-semibold text-dark-900 dark:text-dark-100">
                Grupos de personas ({jpProfile.peopleGroups.length})
              </h3>
              <div
                aria-hidden="true"
                className="mb-3 h-0.5 w-10 rounded-full bg-gradient-to-r from-primary-500 to-sky-400"
              />
              <ul role="list" className="max-h-52 space-y-2 overflow-y-auto pr-1">
                {jpProfile.peopleGroups.map((g) => (
                  <li key={g.id} className="flex items-center gap-3 rounded-xl border border-white/60 bg-white/50 p-2.5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-dark-900/50">
                    {g.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={g.photoUrl} alt={g.peopleName} className="h-11 w-11 shrink-0 rounded-lg object-cover" loading="lazy" />
                    ) : (
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500/20 to-sky-500/20 dark:bg-dark-800">
                        <Users className="h-5 w-5 text-primary-500" aria-hidden="true" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body-sm font-medium text-dark-900 dark:text-dark-100">{g.peopleName}</p>
                      <p className="text-caption text-dark-400 dark:text-dark-500">
                        {formatNumber(g.populationInCountry)} hab. · {g.primaryLanguage}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap justify-end gap-1">
                      {g.isUnreached && <Badge variant="danger" size="sm">No alcanzado</Badge>}
                      {g.isIndigenous && <Badge variant="primary" size="sm">Indígena</Badge>}
                      {g.isFrontier && <Badge variant="warning" size="sm">Frontera</Badge>}
                      {g.isDiaspora && <Badge variant="default" size="sm">Diáspora</Badge>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>
        )}

        {jpProfile && jpProfile.ministries.length > 0 && (
          <Reveal from="bottom" delay={320}>
            <section aria-label="Ministerios">
              <h3 className="mb-2 font-serif text-heading-sm font-semibold text-dark-900 dark:text-dark-100">
                Ministerios ({jpProfile.ministries.length})
              </h3>
              <div
                aria-hidden="true"
                className="mb-2.5 h-0.5 w-10 rounded-full bg-gradient-to-r from-sky-400 to-primary-500"
              />
              <ul role="list" className="space-y-1.5">
                {jpProfile.ministries.map((m) => (
                  <li key={m.id} className="flex items-center gap-2 text-body-sm text-dark-700 dark:text-dark-300">
                    <HeartHandshake className="h-4 w-4 shrink-0 text-primary-500" aria-hidden="true" />
                    <span className="font-medium">{m.ministryName}</span>
                    {m.ministryType && <span className="text-caption text-dark-400">· {m.ministryType}</span>}
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>
        )}

        <Reveal from="bottom" delay={400}>
          <div className="h-2" aria-hidden="true" />
        </Reveal>
      </div>
    </Modal>
  );
}

export function GlobalCountryModal() {
  const isOpen = useAppStore((s) => s.countryModal.isOpen);
  const country = useAppStore((s) => s.countryModal.country);
  const closeCountryModal = useAppStore((s) => s.closeCountryModal);

  return <CountryModal isOpen={isOpen} onClose={closeCountryModal} country={country} />;
}