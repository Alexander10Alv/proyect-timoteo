'use client';

import * as React from 'react';
import { useAppStore } from '@/store';
import { useSiteStore } from '@/store/siteStore';
import { cn, getPostTypeLabel } from '@/lib/utils';
import type { HomeSlideMedia } from '@/lib/siteConfig';
import type { Course } from '@/types';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const MAX_SLIDES = 6;

/**
 * Carrusel hero del muro educativo (/educacion).
 * Los cursos a mostrar vienen de `courseIds` (configuración del sitio); la info
 * de cada slide se toma automáticamente del curso (título, descripción, tipo,
 * portada). Por slide el admin puede forzar una imagen propia o un video corto
 * MP4 mediante `media`.
 */
export function EducacionHero({
  courseIds,
  media,
  buttonColors,
  eyebrow,
}: {
  courseIds: string[];
  media?: Record<string, HomeSlideMedia>;
  buttonColors?: Record<string, string>;
  eyebrow?: string;
}) {
  const courses = useAppStore((s) => s.courses);
  const theme = useSiteStore((s) => s.theme);
  const [index, setIndex] = React.useState(0);

  const slides = React.useMemo(() => {
    const byId = new Map(courses.map((c) => [c.id, c]));
    return courseIds
      .map((id) => byId.get(id))
      .filter((c): c is Course => Boolean(c))
      .slice(0, MAX_SLIDES);
  }, [courseIds, courses]);

  const total = slides.length;

  React.useEffect(() => {
    if (total <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % total), 6000);
    return () => clearInterval(t);
  }, [total]);

  const go = (n: number) => setIndex(((n % total) + total) % total);

  if (total === 0) return null;

  const course = slides[index];
  const slideMedia = media?.[course.id];

  const isVideo = slideMedia?.kind === 'video' && Boolean(slideMedia.url);
  const bg =
    slideMedia?.kind === 'image' && slideMedia.url
      ? slideMedia.url
      : isVideo
        ? ''
        : course.coverImage ?? '';

  return (
    <section
      className="relative flex min-h-[480px] items-center overflow-hidden text-white md:min-h-[540px]"
      style={{ backgroundColor: theme.heroBg }}
    >
      {/* Slides apilados con fade */}
      {slides.slice(0, total).map((s, i) => {
        const m = media?.[s.id];
        const video = m?.kind === 'video' && Boolean(m.url);
        const imageUrl =
          m?.kind === 'image' && m.url ? m.url : video ? '' : s.coverImage ?? '';
        return (
          <div
            key={s.id}
            className={cn(
              'absolute inset-0 transition-opacity duration-700',
              i === index ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
            aria-hidden={i !== index}
          >
            {video ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video
                src={m?.url}
                poster={s.coverImage ?? undefined}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="pointer-events-none h-full w-full object-cover"
              />
            ) : imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={s.title}
                className="pointer-events-none h-full w-full object-cover"
              />
            ) : (
              <div
                aria-hidden="true"
                className="pointer-events-none h-full w-full opacity-[0.06]"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)',
                  backgroundSize: '48px 48px',
                }}
              />
            )}
          </div>
        );
      })}

      {/* Contenido del slide activo */}
      <div className="relative mx-auto w-full max-w-7xl px-4 pt-16 pb-20 sm:px-6 lg:px-8 lg:pt-20 lg:pb-24">
        <div key={index} className="max-w-3xl animate-[heroFade_0.6s_ease]">
          <p
            className="mb-3 flex items-center gap-3 text-body-sm font-bold uppercase tracking-[0.3em]"
            style={{ color: theme.accent }}
          >
            <span className="h-px w-10" style={{ backgroundColor: `${theme.accent}80` }} aria-hidden="true" />
            {eyebrow || getPostTypeLabel(course.type)}
          </p>
          <h1 className="font-display text-display-md font-semibold leading-[1.05] lg:text-display-lg">
            {course.title}
          </h1>
          <p className="mt-4 max-w-2xl rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-body-lg text-white/90 backdrop-blur-md">
            {course.description}
          </p>
          <div className="mt-7">
            <a
              href={`/cursos/${course.id}`}
              className="inline-flex items-center gap-2 rounded-lg px-7 py-3.5 text-lg font-semibold text-white shadow-lg transition hover:opacity-90"
              style={{ backgroundColor: buttonColors?.[course.id] || theme.primary }}
            >
              Ver detalles
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      {/* Flechas */}
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Slide anterior"
            className="absolute left-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur hover:bg-black/50"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Slide siguiente"
            className="absolute right-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur hover:bg-black/50"
          >
            <ChevronRight className="h-6 w-6" aria-hidden="true" />
          </button>
        </>
      )}

      {/* Indicadores (puntos) */}
      {total > 1 && (
        <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ir al slide ${i + 1}`}
              className={cn(
                'h-2.5 rounded-full transition-all',
                i === index ? 'w-8 bg-white' : 'w-2.5 bg-white/40'
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}