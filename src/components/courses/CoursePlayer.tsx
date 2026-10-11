'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { resolveVideoSource, formatDuration } from '@/lib/video';
import type { Course, CourseLesson } from '@/types';
import { PlayCircle, FileDown, ExternalLink, ChevronLeft, ChevronRight, ListVideo, GraduationCap, Mic2, CalendarClock, FileText } from 'lucide-react';

const typeIcons = {
  COURSE: GraduationCap,
  TALK: Mic2,
  EVENT: CalendarClock,
};

interface CoursePlayerProps {
  course: Course;
}

export function CoursePlayer({ course }: CoursePlayerProps) {
  const sortedLessons = React.useMemo(
    () => [...course.lessons].sort((a, b) => a.order - b.order),
    [course.lessons]
  );

  const [activeIndex, setActiveIndex] = React.useState(0);
  const activeLesson: CourseLesson | undefined = sortedLessons[activeIndex];
  const TypeIcon = typeIcons[course.type] ?? GraduationCap;

  const goTo = (index: number) => {
    if (index >= 0 && index < sortedLessons.length) setActiveIndex(index);
  };

  /** Descarga secuencial de todos los recursos de la clase activa. */
  const downloadAllResources = () => {
    if (!activeLesson?.resources) return;
    activeLesson.resources.forEach((resource, i) => {
      setTimeout(() => {
        const anchor = document.createElement('a');
        anchor.href = buildResourceHref(resource);
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
      }, i * 400);
    });
  };

  /** URL de descarga: archivos del servidor usan el nombre asignado al recurso. */
  const buildResourceHref = (resource: { name: string; url: string }): string => {
    if (!resource.url.startsWith('/api/uploads/')) return resource.url;
    const ext = resource.url.slice(resource.url.lastIndexOf('.'));
    const safeName = resource.name.trim() || 'recurso';
    return `${resource.url}?download=1&name=${encodeURIComponent(safeName + ext)}`;
  };

  if (!activeLesson) {
    return (
      <div className="py-20 text-center">
        <ListVideo className="mx-auto mb-4 h-12 w-12 text-dark-300 dark:text-dark-600" aria-hidden="true" />
        <h2 className="font-serif text-heading-lg font-semibold text-dark-900 dark:text-dark-100">
          Este curso aún no tiene clases publicadas
        </h2>
        <p className="mt-2 text-body-md text-dark-500 dark:text-dark-400">
          Vuelve pronto; el equipo está preparando las grabaciones.
        </p>
      </div>
    );
  }

  const video = resolveVideoSource(activeLesson.videoUrl);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      {/* ═══ Zona central: reproductor + info ═══ */}
      <div className="min-w-0 space-y-6">
        <div className="overflow-hidden rounded-xl bg-black shadow-xl">
          {video.canEmbed ? (
            video.kind === 'mp4' ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video
                key={video.embedSrc}
                controls
                className="aspect-video w-full bg-black"
                src={video.embedSrc}
              >
                Tu navegador no soporta video HTML5.
              </video>
            ) : (
              <iframe
                key={video.embedSrc}
                src={video.embedSrc}
                title={`Reproductor: ${activeLesson.title}`}
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )
          ) : (
            /* Enlaces no embebibles (Mega/Zoom): invitación a abrir externo */
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 bg-dark-900 text-center text-dark-300">
              <ExternalLink className="h-10 w-10 text-primary-400" aria-hidden="true" />
              <p className="max-w-sm px-6 text-body-md">
                Esta clase está alojada en una plataforma externa que no permite reproducción incrustada.
              </p>
              <a
                href={video.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-primary-600 px-5 py-2.5 font-medium text-white hover:bg-primary-700"
              >
                Abrir clase en una nueva pestaña
              </a>
            </div>
          )}
        </div>

        {/* ═══ Zona inferior: título, descripción y recursos de la clase actual ═══ */}
        <section aria-label="Información de la clase actual" className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-caption uppercase tracking-wide text-primary-600 dark:text-primary-400">
            <TypeIcon className="h-4 w-4" aria-hidden="true" />
            Clase {activeIndex + 1} de {sortedLessons.length}
            {activeLesson.durationSeconds ? (
              <span className="text-dark-400 dark:text-dark-500">· {formatDuration(activeLesson.durationSeconds)}</span>
            ) : null}
          </div>

          <h2 className="font-serif text-display-sm font-semibold leading-tight text-dark-900 dark:text-dark-100">
            {activeLesson.title}
          </h2>

          {activeLesson.description && (
            <div className="prose-custom max-w-prose">{activeLesson.description}</div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => goTo(activeIndex - 1)}
              disabled={activeIndex === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-dark-200 px-4 py-2 text-body-sm font-medium text-dark-700 transition-colors hover:bg-dark-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-dark-700 dark:text-dark-300 dark:hover:bg-dark-800"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Anterior
            </button>
            <button
              onClick={() => goTo(activeIndex + 1)}
              disabled={activeIndex === sortedLessons.length - 1}
              className="inline-flex items-center gap-1.5 rounded-lg border border-dark-200 px-4 py-2 text-body-sm font-medium text-dark-700 transition-colors hover:bg-dark-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-dark-700 dark:text-dark-300 dark:hover:bg-dark-800"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Recursos de la clase: listado con descarga individual y masiva */}
          {activeLesson.resources && activeLesson.resources.length > 0 && (
            <section
              aria-label="Recursos descargables de la clase"
              className="rounded-xl border border-dark-200 dark:border-dark-700"
            >
              <header className="flex items-center justify-between gap-3 border-b border-dark-100 px-5 py-3.5 dark:border-dark-800">
                <h3 className="flex items-center gap-2 font-serif text-heading-sm font-semibold text-dark-900 dark:text-dark-100">
                  <FileText className="h-4 w-4 text-primary-500" aria-hidden="true" />
                  Recursos de la clase ({activeLesson.resources.length})
                </h3>
                <button
                  onClick={downloadAllResources}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-caption font-semibold text-white transition-colors hover:bg-primary-700"
                >
                  <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
                  Descargar todo
                </button>
              </header>

              <ul role="list" className="divide-y divide-dark-100 dark:divide-dark-800">
                {activeLesson.resources.map((resource) => {
                  const isInternal = resource.url.startsWith('/api/uploads/');
                  return (
                    <li key={resource.id ?? resource.url} className="flex items-center justify-between gap-3 px-5 py-3">
                      <span className="min-w-0">
                        <span className="block truncate text-body-sm font-medium text-dark-800 dark:text-dark-200">
                          {resource.name}
                        </span>
                        <span className="text-caption text-dark-400 dark:text-dark-500">
                          {isInternal ? 'Archivo del servidor' : 'Enlace externo'}
                        </span>
                      </span>
                      <a
                        href={buildResourceHref(resource)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Descargar ${resource.name}`}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-dark-200 px-3 py-2 text-caption font-semibold text-primary-600 transition-colors hover:bg-primary-50 dark:border-dark-600 dark:text-primary-400 dark:hover:bg-primary-900/20"
                      >
                        <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
                        Descargar
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </section>
      </div>

      {/* ═══ Barra lateral derecha: lista de clases ═══ */}
      <aside
        aria-label="Lista de clases del curso"
        className="h-fit overflow-hidden rounded-xl border border-dark-200 bg-white lg:max-h-[80vh] lg:sticky lg:top-24 dark:border-dark-700 dark:bg-dark-900"
      >
        <header className="border-b border-dark-100 px-5 py-4 dark:border-dark-800">
          <h3 className="flex items-center gap-2 font-serif text-heading-md font-semibold text-dark-900 dark:text-dark-100">
            <ListVideo className="h-5 w-5 text-primary-500" aria-hidden="true" />
            Contenido del curso
          </h3>
          <p className="mt-0.5 text-caption text-dark-400 dark:text-dark-500">
            {sortedLessons.length} {sortedLessons.length === 1 ? 'clase' : 'clases'}
          </p>
        </header>

        <ol role="list" className="max-h-[60vh] divide-y divide-dark-100 overflow-y-auto dark:divide-dark-800">
          {sortedLessons.map((lesson, index) => {
            const isActive = index === activeIndex;
            const lessonVideo = resolveVideoSource(lesson.videoUrl);

            return (
              <li key={lesson.id ?? index}>
                <button
                  onClick={() => goTo(index)}
                  aria-current={isActive ? 'true' : undefined}
                  className={cn(
                    'flex w-full items-start gap-3 px-5 py-4 text-left transition-colors',
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20'
                      : 'hover:bg-dark-50 dark:hover:bg-dark-800/60'
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-caption font-semibold',
                      isActive
                        ? 'bg-primary-600 text-white'
                        : 'bg-dark-100 text-dark-500 dark:bg-dark-800 dark:text-dark-400'
                    )}
                  >
                    {isActive && lessonVideo.canEmbed ? (
                      <PlayCircle className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      index + 1
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        'block truncate text-body-sm font-medium',
                        isActive
                          ? 'text-primary-700 dark:text-primary-300'
                          : 'text-dark-800 dark:text-dark-200'
                      )}
                    >
                      {lesson.title}
                    </span>
                    {lesson.durationSeconds ? (
                      <span className="mt-0.5 block text-caption text-dark-400 dark:text-dark-500">
                        {formatDuration(lesson.durationSeconds)}
                        {lesson.resourcesUrl ? ' · incluye recursos' : ''}
                      </span>
                    ) : lesson.resourcesUrl ? (
                      <span className="mt-0.5 block text-caption text-dark-400 dark:text-dark-500">
                        Incluye recursos
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </aside>
    </div>
  );
}