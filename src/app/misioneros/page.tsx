'use client';

import * as React from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui';
import { getInitials, cn } from '@/lib/utils';
import { useSiteStore } from '@/store/siteStore';
import type { Missionary } from '@/types';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Compass,
  Globe2,
  HeartHandshake,
  MapPin,
  Users,
} from 'lucide-react';

const ACCENTS = [
  {
    shadow: 'hover:shadow-sky-500/25',
    border: 'hover:ring-sky-400/60',
    bar: 'from-sky-400 to-primary-500',
    chip: 'bg-sky-400/15 text-sky-300',
    accent: 'text-sky-600 dark:text-sky-400',
    dot: 'bg-sky-400',
  },
  {
    shadow: 'hover:shadow-amber-500/25',
    border: 'hover:ring-amber-400/60',
    bar: 'from-amber-400 to-orange-500',
    chip: 'bg-amber-400/15 text-amber-300',
    accent: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-400',
  },
  {
    shadow: 'hover:shadow-emerald-500/25',
    border: 'hover:ring-emerald-400/60',
    bar: 'from-emerald-400 to-teal-500',
    chip: 'bg-emerald-400/15 text-emerald-300',
    accent: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-400',
  },
  {
    shadow: 'hover:shadow-primary-500/25',
    border: 'hover:ring-primary-400/60',
    bar: 'from-primary-400 to-fuchsia-500',
    chip: 'bg-primary-400/15 text-primary-300',
    accent: 'text-primary-600 dark:text-primary-400',
    dot: 'bg-primary-400',
  },
];

export default function MisionerosPage() {
  const sectionVideo = useSiteStore((s) => s.sections.misioneros?.heroVideo);
  const [missionaries, setMissionaries] = React.useState<Missionary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch('/api/missionaries')
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data.missionaries) {
          setError('No se pudieron cargar los misioneros.');
          return;
        }
        setMissionaries(data.missionaries);
      })
      .catch(() => {
        if (!cancelled) setError('No se pudo conectar con el servidor.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = React.useMemo(() => {
    const countries = new Set(missionaries.filter((m) => m.countryName).map((m) => m.countryName as string));
    const stories = missionaries.reduce((acc, m) => acc + m.stories.length, 0);
    return [
      { icon: Users, value: missionaries.length, label: 'Misioneros' },
      { icon: Globe2, value: countries.size, label: 'Países' },
      { icon: BookOpen, value: stories, label: 'Testimonios' },
    ];
  }, [missionaries]);

  return (
    <>
      {/* ─────────────────────── HERO ─────────────────────── */}
      <section className="relative overflow-hidden bg-dark-950 text-white">
        {sectionVideo?.url && (
          <>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              src={sectionVideo.url}
              poster={sectionVideo.poster ?? undefined}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-dark-950/70" />
          </>
        )}

        {/* Glows de color (aurora) */}
        <div aria-hidden="true" className="animate-bob absolute -left-28 top-8 h-80 w-80 rounded-full bg-sky-500/25 blur-[110px]" />
        <div aria-hidden="true" className="animate-bob absolute -right-20 top-44 h-96 w-96 rounded-full bg-primary-500/25 blur-[120px]" style={{ animationDelay: '-2s' }} />
        <div aria-hidden="true" className="animate-bob absolute -bottom-24 left-1/3 h-80 w-80 rounded-full bg-amber-400/20 blur-[110px]" style={{ animationDelay: '-3.5s' }} />

        {/* Rejilla + puntos */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Brújula girando */}
        <div aria-hidden="true" className="pointer-events-none absolute right-10 top-1/2 hidden -translate-y-1/2 lg:block">
          <div className="relative flex h-44 w-44 animate-[spin_26s_linear_infinite] items-center justify-center rounded-full border border-white/10">
            <Compass className="h-36 w-36 text-sky-400/40 transition-colors" />
            {['top-0 left-1/2 -translate-x-1/2', 'bottom-0 left-1/2 -translate-x-1/2', 'left-0 top-1/2 -translate-y-1/2', 'right-0 top-1/2 -translate-y-1/2'].map((pos) => (
              <span key={pos} className={cn('absolute h-2 w-2 rounded-full bg-sky-400/60 shadow-[0_0_10px_rgba(56,189,248,0.9)]', pos)} />
            ))}
          </div>
          <div aria-hidden="true" className="absolute inset-0 animate-[spin_2s_ease-in-out_infinite] rounded-full border-t-2 border-sky-400/40" style={{ animationDirection: 'reverse' }} />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-28">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-caption font-semibold uppercase tracking-[0.3em] text-sky-300 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-400" />
            </span>
            Nuestro equipo en el campo
          </p>
          <h1 className="max-w-2xl font-display text-display-md font-semibold leading-[1.05] lg:text-display-lg">
            Los{' '}
            <span className="bg-gradient-to-r from-sky-300 via-primary-300 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(56,189,248,0.35)]">
              misioneros
            </span>{' '}
            que Dios nos ha dado sostener
          </h1>
          <p className="mt-6 max-w-2xl text-body-lg leading-relaxed text-dark-200">
            Conoce a los obreros y sus familias entre los pueblos no alcanzados. Cada uno testifica
            de la obra de Cristo y de cómo tú puedes participar en oración y provisión.
          </p>

          {!loading && missionaries.length > 0 && (
            <div className="mt-9 flex flex-wrap items-center gap-3">
              {stats.map((s, i) => (
                <span
                  key={s.label}
                  className="inline-flex items-center gap-2.5 rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-2.5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-300/40 hover:bg-white/10"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
                    <s.icon className={cn('h-4 w-4', ACCENTS[i % ACCENTS.length].accent)} aria-hidden="true" />
                  </span>
                  <span className="leading-tight">
                    <span className="block font-mono text-lg font-bold tabular-nums">{s.value}</span>
                    <span className="block text-[11px] font-medium uppercase tracking-wider text-dark-300">{s.label}</span>
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Línea divisoria degradada */}
        <div aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-400/60 to-transparent" />
      </section>

      {/* ─────────────────────── LISTA ─────────────────────── */}
      <section className="relative overflow-hidden bg-dark-50/70 py-16 dark:bg-dark-950">
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-primary-500/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-400/40 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-caption font-bold uppercase tracking-[0.3em] text-sky-600 dark:text-sky-400">
                <span className="h-px w-8 bg-sky-500/60" aria-hidden="true" />
                Están en la cancha
              </p>
              <h2 className="mt-3 font-display text-heading-lg font-semibold text-dark-900 dark:text-dark-100">
                Nuestros misioneros
              </h2>
            </div>
            {!loading && (
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-caption font-semibold text-sky-700 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-300">
                <HeartHandshake className="h-4 w-4" aria-hidden="true" />
                {missionaries.length} obreros en el campo
              </span>
            )}
          </div>

          {error && (
            <div role="alert" className="mb-8 flex items-start gap-3 rounded-xl bg-amber-50 px-5 py-4 dark:bg-amber-900/20">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" aria-hidden="true" />
              <p className="text-body-sm text-amber-700 dark:text-amber-300">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl bg-white ring-1 ring-dark-200 dark:bg-dark-900 dark:ring-dark-700">
                  <Skeleton variant="rectangular" className="h-48 w-full" />
                  <div className="space-y-2 p-5">
                    <Skeleton variant="text" width="1/2" />
                    <Skeleton variant="text" width="1/3" />
                    <Skeleton variant="text" width="1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : missionaries.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-dark-300 py-16 text-center dark:border-dark-700">
              <Compass className="mx-auto mb-3 h-10 w-10 text-dark-300 dark:text-dark-600" aria-hidden="true" />
              <h3 className="font-display text-heading-lg font-semibold text-dark-900 dark:text-dark-100">
                Aún no hay misioneros publicados
              </h3>
              <p className="mt-2 text-body-md text-dark-500 dark:text-dark-400">
                Los perfiles de nuestros obreros aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {missionaries.map((m, i) => {
                const a = ACCENTS[i % ACCENTS.length];
                return (
                  <Link
                    key={m.id}
                    href={`/misioneros/${m.slug}`}
                    className={cn(
                      'group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-dark-200 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl dark:bg-dark-900 dark:ring-dark-700',
                      a.shadow,
                      a.border
                    )}
                  >
                    {/* Barra superior que se revela */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute inset-x-0 top-0 z-10 h-1 origin-left scale-x-0 bg-gradient-to-r transition-transform duration-500 group-hover:scale-x-100',
                        a.bar
                      )}
                    />

                    {/* Foto */}
                    <div className="relative h-48 overflow-hidden">
                      {m.photoUrl ? (
                        <img
                          src={m.photoUrl}
                          alt={`Foto de ${m.name}`}
                          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-500 via-primary-500 to-amber-400">
                          <span className="font-display text-4xl font-bold text-white/90 drop-shadow-lg">
                            {getInitials(m.name)}
                          </span>
                        </div>
                      )}
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-t from-dark-950/70 via-dark-950/10 to-transparent"
                      />
                      {m.status === 'ACTIVE' && (
                        <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-400/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-dark-950 shadow-lg shadow-emerald-500/30 backdrop-blur">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-dark-950" aria-hidden="true" />
                          Activo
                        </span>
                      )}
                      {m.role && (
                        <span
                          className={cn(
                            'absolute bottom-3 left-3 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest backdrop-blur-md',
                            a.chip
                          )}
                        >
                          {m.role}
                        </span>
                      )}
                    </div>

                    {/* Cuerpo */}
                    <div className="flex min-w-0 flex-1 flex-col p-5">
                      <h2 className="font-display text-heading-sm font-semibold text-dark-900 transition-colors dark:text-dark-100">
                        {m.name}
                      </h2>
                      <div className="mt-2.5 space-y-1.5 text-caption text-dark-500 dark:text-dark-400">
                        {m.countryName && (
                          <p className="flex items-center gap-2">
                            <Globe2 className={cn('h-3.5 w-3.5', a.accent)} aria-hidden="true" />
                            {m.countryName}
                          </p>
                        )}
                        {m.peopleName && (
                          <p className="flex items-center gap-2">
                            <MapPin className={cn('h-3.5 w-3.5', a.accent)} aria-hidden="true" />
                            {m.peopleName}
                          </p>
                        )}
                      </div>

                      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-dark-100 px-2.5 py-1 text-[11px] font-semibold text-dark-600 dark:bg-dark-800 dark:text-dark-300">
                          <span className={cn('h-1.5 w-1.5 rounded-full', a.dot)} aria-hidden="true" />
                          {m.stories.length > 0
                            ? `${m.stories.length} ${m.stories.length === 1 ? 'testimonio' : 'testimonios'}`
                            : 'Recién llegado'}
                        </span>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 text-body-sm font-bold transition-all duration-300',
                            a.accent,
                            'group-hover:gap-2.5'
                          )}
                        >
                          Ver perfil
                          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45" aria-hidden="true" />
                        </span>
                      </div>
                    </div>

                    {/* Borde inferior degradado */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute inset-x-0 bottom-0 h-px origin-right scale-x-0 bg-gradient-to-r transition-transform duration-500 group-hover:origin-left group-hover:scale-x-100',
                        a.bar
                      )}
                    />
                  </Link>
                );
              })}
            </div>
          )}

          {!loading && missionaries.length > 0 && (
            <p className="mt-12 flex items-center justify-center gap-2 text-caption text-dark-400 dark:text-dark-500">
              Cada obrero puede ser sostenido con oración y donaciones.
              <Link href="/#misioneros" className="inline-flex items-center gap-1 font-semibold text-sky-600 transition-colors hover:text-amber-600 dark:text-sky-400 dark:hover:text-amber-300">
                Explora sus historias
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </p>
          )}
        </div>
      </section>
    </>
  );
}