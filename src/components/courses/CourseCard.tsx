'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn, getPostTypeLabel, formatDate } from '@/lib/utils';
import { Badge, Card } from '@/components/ui';
import { PlaySquare, GraduationCap, Mic2, CalendarClock, Clock3, CalendarDays, MapPin, Video } from 'lucide-react';
import type { Course } from '@/types';

const typeIcons = {
  COURSE: GraduationCap,
  TALK: Mic2,
  EVENT: CalendarClock,
};

export function CourseCard({ course }: { course: Course }) {
  const TypeIcon = typeIcons[course.type] ?? GraduationCap;
  const totalSeconds = course.lessons.reduce((sum, l) => sum + (l.durationSeconds ?? 0), 0);

  return (
    <Link href={`/cursos/${course.id}`} className="group block h-full" aria-label={`Abrir curso ${course.title}`}>
      <Card variant="outlined" padding="none" className="flex h-full flex-col overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
        {/* Portada */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-dark-800 to-dark-900">
          {course.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.coverImage}
              alt={`Portada de ${course.title}`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <TypeIcon className="h-14 w-14 text-primary-400/60" aria-hidden="true" />
            </div>
          )}

          {/* Overlay con botón de reproducción */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 shadow-xl">
              <PlaySquare className="h-6 w-6 text-white" aria-hidden="true" />
            </span>
          </div>

          <Badge variant="primary" size="sm" className="absolute left-3 top-3 shadow-sm">
            {getPostTypeLabel(course.type)}
          </Badge>
        </div>

        {/* Contenido */}
        <div className="flex flex-1 flex-col px-5 py-4">
          <h3 className="font-serif text-heading-lg font-semibold leading-snug text-dark-900 line-clamp-2 dark:text-dark-100">
            {course.title}
          </h3>
          <p className="mt-2 text-body-sm text-dark-500 line-clamp-2 dark:text-dark-400">
            {course.description}
          </p>

          {course.type !== 'COURSE' && (course.eventDate || course.location || course.modality === 'VIRTUAL') && (
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-dark-500 dark:text-dark-400">
              {course.eventDate && (
                <span className="flex items-center gap-1.5 font-medium text-primary-600 dark:text-primary-400">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                  {formatDate(course.eventDate)}
                </span>
              )}
              {course.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {course.location}
                </span>
              )}
              {!course.location && course.modality === 'VIRTUAL' && (
                <span className="flex items-center gap-1.5">
                  <Video className="h-3.5 w-3.5" aria-hidden="true" />
                  Virtual
                </span>
              )}
            </div>
          )}

          {course.type !== 'COURSE' && (course.pricePEN != null || course.priceUSD != null) && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {course.pricePEN != null && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-caption font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  S/ {formatPrice(course.pricePEN)}
                </span>
              )}
              {course.priceUSD != null && (
                <span className="rounded-full bg-sky-100 px-2.5 py-1 text-caption font-bold text-sky-800 dark:bg-sky-900/40 dark:text-sky-300">
                  US$ {formatPrice(course.priceUSD)}
                </span>
              )}
              <span className="rounded-full bg-dark-100 px-2.5 py-1 text-caption font-medium text-dark-500 dark:bg-dark-800 dark:text-dark-400">
                con inscripción
              </span>
            </div>
          )}
        </div>

        {/* Pie con metadatos — conteo de clases solo para Cursos */}
        <div className="mt-auto flex items-center justify-between border-t border-dark-100 px-5 py-3.5 text-caption text-dark-400 dark:border-dark-800 dark:text-dark-500">
          {course.type === 'COURSE' ? (
            <>
              <span className="flex items-center gap-1.5">
                <PlaySquare className="h-3.5 w-3.5" aria-hidden="true" />
                {course.lessons.length} {course.lessons.length === 1 ? 'clase' : 'clases'}
              </span>
              {totalSeconds > 0 && (
                <span className={cn('flex items-center gap-1.5')}>
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  {formatDurationShort(totalSeconds)}
                </span>
              )}
            </>
          ) : (
            <span className="flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
              {course.type === 'TALK' ? 'Charla' : 'Evento'}
            </span>
          )}
          <time dateTime={new Date(course.createdAt).toISOString()}>
            {formatDate(course.createdAt)}
          </time>
        </div>
      </Card>
    </Link>
  );
}

function formatDurationShort(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes} min`;
}

function formatPrice(value: number): string {
  return value.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
}