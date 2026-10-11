'use client';

import * as React from 'react';
import { Badge } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import type { Course, Modality } from '@/types';
import { CalendarDays, MapPin, Video, PlayCircle, Users, BadgeDollarSign, Lock } from 'lucide-react';

const MODALITY_LABELS: Record<Modality, string> = {
  VIRTUAL: 'Virtual',
  IN_PERSON: 'Presencial',
  HYBRID: 'Híbrido',
};

function formatPrice(value: number): string {
  return value.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
}

export function formatEventDateTime(date?: Date): string {
  if (!date) return '';
  const d = new Date(date);
  const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  return `${formatDate(d)} · ${time} h`;
}

/**
 * Panel público de detalles para Charlas y Eventos:
 * fecha/hora, modalidad, dirección física (si aplica) y enlace de reunión
 * o etiqueta Presencial; incluye la grabación cuando exista.
 */
export function EventDetails({ course, canAccess = false }: { course: Course; canAccess?: boolean }) {
  const modality: Modality | undefined = course.modality ?? 'VIRTUAL';
  const isVirtualOnly = !course.location;

  return (
    <section aria-label="Detalles del evento" className="rounded-xl border border-dark-200 dark:border-dark-700">
      <header className="border-b border-dark-100 px-6 py-4 dark:border-dark-800">
        <h2 className="font-serif text-heading-lg font-semibold text-dark-900 dark:text-dark-100">
          Detalles del {course.type === 'TALK' ? 'charla' : 'evento'}
        </h2>
      </header>

      <dl className="grid gap-5 p-6 sm:grid-cols-2">
        {/* Fecha y hora */}
        {course.eventDate && (
          <div className="flex items-start gap-3">
            <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-primary-500" aria-hidden="true" />
            <div>
              <dt className="text-caption uppercase tracking-wide text-dark-400 dark:text-dark-500">Fecha y hora</dt>
              <dd className="text-body-md font-medium text-dark-900 dark:text-dark-100">
                {formatEventDateTime(course.eventDate)}
              </dd>
            </div>
          </div>
        )}

        {/* Costo de inscripción */}
        <div className="flex items-start gap-3">
          <BadgeDollarSign className="mt-0.5 h-5 w-5 shrink-0 text-primary-500" aria-hidden="true" />
          <div>
            <dt className="text-caption uppercase tracking-wide text-dark-400 dark:text-dark-500">Costo de inscripción</dt>
            <dd className="text-body-md font-medium text-dark-900 dark:text-dark-100">
              {course.pricePEN != null || course.priceUSD != null ? (
                <span className="flex flex-wrap items-center gap-2">
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
                </span>
              ) : (
                <span className="text-green-600 dark:text-green-400">Gratis</span>
              )}
            </dd>
          </div>
        </div>

        {/* Modalidad */}
        <div className="flex items-start gap-3">
          <Users className="mt-0.5 h-5 w-5 shrink-0 text-primary-500" aria-hidden="true" />
          <div>
            <dt className="text-caption uppercase tracking-wide text-dark-400 dark:text-dark-500">Modalidad</dt>
            <dd className="text-body-md font-medium text-dark-900 dark:text-dark-100">
              {modality ? MODALITY_LABELS[modality] : MODALITY_LABELS.VIRTUAL}
            </dd>
          </div>
        </div>

        {/* Dirección física si aplica */}
        {(modality === 'IN_PERSON' || modality === 'HYBRID') && course.location && (
          <div className="flex items-start gap-3 sm:col-span-2">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary-500" aria-hidden="true" />
            <div className="min-w-0">
              <dt className="text-caption uppercase tracking-wide text-dark-400 dark:text-dark-500">Dirección</dt>
              <dd className="text-body-md font-medium text-dark-900 dark:text-dark-100">{course.location}</dd>
            </div>
          </div>
        )}

        {/* Enlace de reunión o etiqueta Presencial */}
        {(modality === 'VIRTUAL' || modality === 'HYBRID') && course.meetingLink && (
          <div className="flex items-start gap-3 sm:col-span-2">
            <Video className="mt-0.5 h-5 w-5 shrink-0 text-primary-500" aria-hidden="true" />
            <div className="min-w-0">
              <dt className="text-caption uppercase tracking-wide text-dark-400 dark:text-dark-500">Reunión en vivo</dt>
              <dd>
                {canAccess ? (
                  <a
                    href={course.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-body-sm font-medium text-white hover:bg-primary-700"
                  >
                    Unirse a la reunión
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-dark-100 px-4 py-2 text-body-sm font-medium text-dark-500 dark:bg-dark-800 dark:text-dark-400">
                    <Lock className="h-4 w-4" aria-hidden="true" />
                    Disponible al inscribirte
                  </span>
                )}
              </dd>
            </div>
          </div>
        )}

        {modality === 'IN_PERSON' && (
          <div className="sm:col-span-2">
            <Badge variant="primary" size="md">
              <MapPin className="mr-1.5 inline h-3.5 w-3.5" aria-hidden="true" />
              Presencial{isVirtualOnly ? '' : ' · consulta la dirección'}
            </Badge>
          </div>
        )}

        {/* Grabación post-evento */}
        {course.recordingLink && (
          <div className="flex items-start gap-3 border-t border-dark-100 pt-5 sm:col-span-2 dark:border-dark-800">
            <PlayCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary-500" aria-hidden="true" />
            <div>
              <dt className="mb-1.5 text-caption uppercase tracking-wide text-dark-400 dark:text-dark-500">Grabación</dt>
              <dd>
                {canAccess ? (
                  <a
                    href={course.recordingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary-500 px-4 py-2 text-body-sm font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20"
                  >
                    Ver grabación
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-dark-100 px-4 py-2 text-body-sm font-medium text-dark-500 dark:bg-dark-800 dark:text-dark-400">
                    <Lock className="h-4 w-4" aria-hidden="true" />
                    Disponible al inscribirte
                  </span>
                )}
              </dd>
            </div>
          </div>
        )}
      </dl>
    </section>
  );
}