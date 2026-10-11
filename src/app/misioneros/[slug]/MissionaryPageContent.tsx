'use client';

import * as React from 'react';
import Link from 'next/link';
import { Badge, Skeleton } from '@/components/ui';
import { getInitials, formatDate } from '@/lib/utils';
import { Reveal } from '@/components/effects/Reveal';
import type { Missionary } from '@/types';
import { ArrowLeft, Globe2, HeartHandshake, BookOpen, Compass, Quote, Video } from 'lucide-react';

export function MissionaryPageContent({ slug }: { slug: string }) {
  const [missionary, setMissionary] = React.useState<Missionary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    fetch(`/api/missionaries/${encodeURIComponent(slug)}`)
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data.missionary) {
          setNotFound(true);
          return;
        }
        setMissionary(data.missionary);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Skeleton variant="text" width="1/3" />
        <div className="mt-6 flex flex-col gap-6 sm:flex-row">
          <Skeleton variant="rectangular" className="aspect-[4/5] w-full max-w-xs shrink-0" />
          <div className="flex-1 space-y-3">
            <Skeleton variant="text" width="3/4" />
            <Skeleton variant="text" width="1/2" />
            <Skeleton variant="text" />
            <Skeleton variant="text" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !missionary) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <Compass className="mx-auto mb-4 h-12 w-12 text-primary-300 dark:text-primary-700" aria-hidden="true" />
        <h1 className="font-serif text-display-md font-semibold text-dark-900 dark:text-dark-100">
          Misionero no encontrado
        </h1>
        <p className="mt-3 text-body-md text-dark-500 dark:text-dark-400">
          El perfil que buscas no existe o no está publicado.
        </p>
        <Link
          href="/misioneros"
          className="mt-6 inline-flex items-center gap-2 font-medium text-sky-600 transition-colors hover:text-[#d99d70] dark:text-sky-400"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a misioneros
        </Link>
      </div>
    );
  }

  return (
    <article className="pb-20">
      {/* ── Cabecera clara y viva (sin degradado) ── */}
      <section className="relative overflow-hidden border-b border-sky-100 bg-sky-50/80 dark:border-dark-800 dark:bg-dark-950">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 25%, #0ea5e9 1px, transparent 1px), radial-gradient(circle at 75% 75%, #0ea5e9 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div aria-hidden="true" className="animate-bob absolute -left-16 -top-16 h-56 w-56 rounded-full bg-sky-200/50 blur-2xl dark:bg-sky-500/10" style={{ animationDelay: '-2s' }} />
        <div aria-hidden="true" className="animate-bob absolute -right-20 top-8 h-64 w-64 rounded-full bg-amber-100/70 blur-2xl dark:bg-amber-400/10" style={{ animationDelay: '-4s' }} />
        <div aria-hidden="true" className="animate-bob absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-emerald-100/60 blur-2xl dark:bg-emerald-400/10" style={{ animationDelay: '-1s' }} />

        <div className="relative z-20 mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <Reveal from="top">
            <Link
              href="/misioneros"
              className="inline-flex items-center gap-2 text-body-sm font-medium text-sky-600 transition-all hover:-translate-x-0.5 hover:text-amber-600 dark:text-sky-400 dark:hover:text-amber-300"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Todos los misioneros
            </Link>
          </Reveal>

          <header className="mt-8 flex flex-col gap-10 md:flex-row md:items-start">
            <Reveal from="left" className="shrink-0">
              <div className="group relative mx-auto w-64 md:w-64 lg:w-72">
                {missionary.photoUrl ? (
                  <img
                    src={missionary.photoUrl}
                    alt={`Foto de ${missionary.name}`}
                    className="relative aspect-[4/5] w-full rounded-2xl border-4 border-sky-300 object-cover shadow-lg shadow-sky-200/60 transition-all duration-300 hover:-translate-y-1.5 hover:rotate-1 hover:scale-[1.02] hover:border-amber-300 hover:shadow-2xl hover:shadow-sky-300/50 dark:border-sky-600/60 dark:hover:border-amber-400/70"
                  />
                ) : (
                  <div className="relative flex aspect-[4/5] w-full items-center justify-center rounded-2xl border-4 border-sky-300 bg-sky-100 transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-300 hover:shadow-2xl hover:shadow-sky-300/50 dark:border-sky-600/60 dark:bg-sky-500/15">
                    <span className="font-serif text-6xl font-semibold text-sky-600 dark:text-sky-300">
                      {getInitials(missionary.name)}
                    </span>
                  </div>
                )}

                {missionary.status === 'ACTIVE' && (
                  <span className="absolute -right-2 -top-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow-md shadow-emerald-500/40 transition-transform duration-300 hover:scale-110">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" aria-hidden="true" />
                    Activo
                  </span>
                )}
              </div>
            </Reveal>

            <div className="flex-1 text-center md:text-left">
              <Reveal delay={80}>
                <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                  {missionary.stories.length > 0 && (
                    <Badge variant="outline" size="sm" className="border-sky-200 bg-white/80 text-sky-700 shadow-sm transition-transform duration-300 hover:-translate-y-0.5 hover:border-amber-300 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300">
                      <BookOpen className="mr-1 h-3 w-3" aria-hidden="true" />
                      {missionary.stories.length} {missionary.stories.length === 1 ? 'testimonio' : 'testimonios'}
                    </Badge>
                  )}
                </div>

                <h1 className="mt-4 font-serif text-display-md font-semibold leading-tight text-dark-900 dark:text-dark-100 lg:text-display-lg">
                  {missionary.name}
                </h1>

                <p className="mt-3 inline-block rounded-full bg-sky-100 px-4 py-1.5 text-body-lg font-semibold text-sky-700 transition-transform duration-300 hover:scale-105 dark:bg-sky-500/15 dark:text-sky-300">
                  {missionary.role}
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                  {missionary.countryName && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-white px-3 py-1.5 text-body-sm font-medium text-dark-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md dark:border-sky-500/30 dark:bg-dark-900 dark:text-dark-200">
                      <Globe2 className="h-4 w-4" style={{ color: '#0ea5e9' }} aria-hidden="true" />
                      {missionary.countryName}
                      {missionary.countryCode ? ` (${missionary.countryCode})` : ''}
                    </span>
                  )}
                  {missionary.peopleName && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-white px-3 py-1.5 text-body-sm font-medium text-dark-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md dark:border-sky-500/30 dark:bg-dark-900 dark:text-dark-200">
                      <FavoriteGroup className="h-4 w-4" style={{ color: '#0ea5e9' }} aria-hidden="true" />
                      {missionary.peopleName}
                    </span>
                  )}
                </div>

                {missionary.bio && (
                  <p className="mt-6 whitespace-pre-wrap rounded-2xl border border-sky-100 bg-white px-5 py-4 text-left text-body-lg leading-relaxed text-dark-700 shadow-sm transition-shadow duration-300 hover:shadow-lg dark:border-sky-500/20 dark:bg-dark-900/70 dark:text-dark-200">
                    {missionary.bio}
                  </p>
                )}

                <div className="mt-8 flex flex-wrap items-center justify-center gap-3 md:justify-start">
                  <Link
                    href="/donar"
                    className="inline-flex items-center gap-2 rounded-full border-2 border-sky-300 bg-sky-500 px-6 py-3 text-body-lg font-semibold text-white shadow-md shadow-sky-500/30 transition-all duration-300 hover:-translate-y-1 hover:border-amber-300 hover:bg-sky-400 hover:shadow-xl hover:shadow-sky-400/40"
                  >
                    <HeartHandshake className="h-5 w-5" aria-hidden="true" />
                    Sostener este misionero
                  </Link>
                </div>
              </Reveal>
            </div>
          </header>
        </div>
      </section>

      {/* ── Video de presentación ── */}
      {missionary.videoUrl && (
        <section aria-label="Video de presentación" className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <Reveal from="bottom">
            <div className="mb-10 flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-primary-600 text-white shadow-lg shadow-sky-500/30">
                <Video className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-serif text-display-sm font-semibold text-dark-900 dark:text-dark-100">
                  Video de presentación
                </h2>
                <div aria-hidden="true" className="mt-1.5 h-0.5 w-14 rounded-full bg-gradient-to-r from-sky-500 to-primary-600" />
              </div>
            </div>
          </Reveal>
          <Reveal from="bottom" delay={80}>
            <div className="overflow-hidden rounded-2xl border border-sky-100 shadow-lg transition-shadow duration-300 hover:shadow-xl hover:shadow-sky-200/40 dark:border-dark-800 dark:hover:shadow-sky-500/10">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                src={missionary.videoUrl}
                poster={missionary.photoUrl ?? undefined}
                controls
                playsInline
                className="aspect-video w-full bg-dark-950 object-contain"
              />
            </div>
          </Reveal>
        </section>
      )}

      {/* ── Historias y testimonios ── */}
      {missionary.stories.length > 0 && (
        <section aria-label="Historias y testimonios" className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <Reveal from="bottom">
            <div className="mb-10 flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-primary-600 text-white shadow-lg shadow-sky-500/30">
                <BookOpen className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-serif text-display-sm font-semibold text-dark-900 dark:text-dark-100">
                  Historias y testimonios
                </h2>
                <div aria-hidden="true" className="mt-1.5 h-0.5 w-14 rounded-full bg-gradient-to-r from-sky-500 to-primary-600" />
              </div>
            </div>
          </Reveal>

          <div className="space-y-6">
            {missionary.stories.map((story, idx) => (
              <Reveal key={story.id} from="bottom" delay={idx * 120}>
                <blockquote className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/60 p-6 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-xl hover:shadow-sky-200/40 sm:p-8 dark:border-white/10 dark:bg-dark-900/60 dark:hover:border-sky-500/30">
                  <span aria-hidden="true" className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-sky-500 to-primary-600" />
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <Quote className="h-7 w-7 rotate-180" style={{ color: '#0ea5e9' }} aria-hidden="true" />
                    {story.storyDate && (
                      <time className="text-caption text-dark-400 dark:text-dark-500">{formatDate(story.storyDate)}</time>
                    )}
                  </div>
                  <h3 className="font-serif text-heading-lg font-semibold text-dark-900 dark:text-dark-100">
                    {story.title}
                  </h3>
                  <p className="mt-3 whitespace-pre-wrap text-body-md leading-relaxed text-dark-600 dark:text-dark-300">
                    {story.body}
                  </p>
                </blockquote>
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

function FavoriteGroup({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="7" r="3" />
      <path d="M3 21v-1a6 6 0 0 1 12 0v1" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <path d="M21 21v-1a6 6 0 0 0-3.77-5.53" />
    </svg>
  );
}