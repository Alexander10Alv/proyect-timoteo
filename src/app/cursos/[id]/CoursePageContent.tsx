'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store';
import { CoursePlayer } from '@/components/courses/CoursePlayer';
import { EventDetails } from '@/components/courses/EventDetails';
import { EventCheckoutModal } from '@/components/courses/EventCheckoutModal';
import { Badge, Skeleton, Button } from '@/components/ui';
import { getPostTypeLabel } from '@/lib/utils';
import type { CoursePurchase } from '@/types';
import {
  ArrowLeft,
  GraduationCap,
  Mic2,
  CalendarClock,
  LogIn,
  Lock,
  BadgeDollarSign,
  CheckCircle2,
} from 'lucide-react';

function formatPrice(value: number): string {
  return value.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
}

export function CoursePageContent({ courseId }: { courseId: string }) {
  const router = useRouter();
  const courses = useAppStore((s) => s.courses);
  const fetchCourses = useAppStore((s) => s.fetchCourses);
  const coursesLoading = useAppStore((s) => s.coursesLoading);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const openLoginModal = useAppStore((s) => s.openLoginModal);
  const addEnrolledCourse = useAppStore((s) => s.addEnrolledCourse);
  const [loadedOnce, setLoadedOnce] = React.useState(false);
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);
  const [purchase, setPurchase] = React.useState<CoursePurchase | null>(null);

  React.useEffect(() => {
    void fetchCourses().finally(() => setLoadedOnce(true));
  }, [fetchCourses]);

  const course = courses.find((c) => c.id === courseId);

  const loadMyPurchase = React.useCallback(async () => {
    if (!course) return;
    if (!isAuthenticated) {
      setPurchase(null);
      return;
    }
    try {
      const response = await fetch(`/api/courses/${course.id}/my-purchase`, { cache: 'no-store' });
      const data = (await response.json()) as { purchase?: CoursePurchase | null };
      setPurchase(data.purchase ?? null);
    } catch {
      setPurchase(null);
    }
  }, [course, isAuthenticated]);

  React.useEffect(() => {
    setPurchase(null);
    if (course) void loadMyPurchase();
  }, [loadMyPurchase, course]);

  if (coursesLoading && !loadedOnce) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <Skeleton variant="rectangular" className="aspect-video" />
            <Skeleton variant="text" width="3/4" height={32} />
            <Skeleton variant="text" lines={3} />
          </div>
          <Skeleton variant="rectangular" height={420} />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-32 text-center">
        <p className="font-serif text-display-sm font-semibold text-dark-900 dark:text-dark-100">
          Curso no encontrado
        </p>
        <p className="mt-4 text-body-md text-dark-500 dark:text-dark-400">
          El curso que buscas no existe o fue eliminado.
        </p>
        <Link
          href="/educacion"
          className="mt-8 inline-block rounded-lg bg-primary-600 px-6 py-3 font-medium text-white hover:bg-primary-700"
        >
          Explorar otros cursos
        </Link>
      </div>
    );
  }

  const TypeIcon =
    course.type === 'COURSE' ? GraduationCap : course.type === 'TALK' ? Mic2 : CalendarClock;

  const canAccess = !!purchase && purchase.status === 'COMPLETED';
  const hasPEN = course.pricePEN != null && course.pricePEN > 0;
  const hasUSD = course.priceUSD != null && course.priceUSD > 0;
  const isFreeEvent = !hasPEN && !hasUSD;

  const priceLabel = isFreeEvent
    ? 'Gratis'
    : [hasPEN ? `S/ ${formatPrice(course.pricePEN as number)}` : null, hasUSD ? `US$ ${formatPrice(course.priceUSD as number)}` : null]
        .filter(Boolean)
        .join(' · ');

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <button
        onClick={() => router.push('/educacion')}
        className="mb-6 inline-flex items-center gap-2 text-body-sm font-medium text-dark-500 transition-colors hover:text-dark-900 dark:text-dark-400 dark:hover:text-dark-100"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver al muro educativo
      </button>

      {/* Encabezado del curso */}
      <header className="mb-10 border-b border-dark-200 pb-8 dark:border-dark-800">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="primary" size="sm">
            <TypeIcon className="mr-1.5 inline h-3.5 w-3.5" aria-hidden="true" />
            {getPostTypeLabel(course.type)}
          </Badge>
          <span className="text-caption text-dark-400 dark:text-dark-500">
            Por {course.authorName ?? 'Equipo Proyecto Timoteo'}
          </span>
        </div>
        <h1 className="mt-4 max-w-3xl font-serif text-display-md font-semibold leading-tight text-dark-900 dark:text-dark-100">
          {course.title}
        </h1>
        <p className="mt-4 max-w-prose text-body-lg text-dark-500 dark:text-dark-400">
          {course.description}
        </p>
      </header>

      {course.type === 'COURSE' ? (
        <div className="space-y-8">
          <aside
            aria-label="Inscripción al curso"
            className="rounded-xl border border-dark-200 bg-dark-50/40 p-6 dark:border-dark-700 dark:bg-dark-900/40"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <GraduationCap className="mt-0.5 h-6 w-6 shrink-0 text-primary-500" aria-hidden="true" />
                <div>
                  <h2 className="font-serif text-heading-md font-semibold text-dark-900 dark:text-dark-100">
                    Curso de acceso libre
                  </h2>
                  <p className="mt-1 text-body-sm text-dark-500 dark:text-dark-400">
                    Las clases se reproducen directamente. Inscríbete gratis para guardarlo en
                    «Mis inscripciones» y continuarlo cuando quieras.
                  </p>
                </div>
              </div>
              <div className="w-full sm:w-auto">
                {!isAuthenticated ? (
                  <Button size="xl" className="w-full sm:w-auto" onClick={() => openLoginModal('login')}>
                    <LogIn className="mr-2 h-4 w-4" aria-hidden="true" />
                    Inicia sesión para inscribirte
                  </Button>
                ) : canAccess ? (
                  <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-body-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Inscrito ✓
                  </div>
                ) : (
                  <Button size="xl" className="w-full sm:w-auto" onClick={() => setCheckoutOpen(true)}>
                    <GraduationCap className="mr-2 h-4 w-4" aria-hidden="true" />
                    Inscribirme gratis
                  </Button>
                )}
              </div>
            </div>
          </aside>
          <CoursePlayer course={course} />
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <EventDetails course={course} canAccess={canAccess} />

          {/* Panel de inscripción */}
          <aside aria-label="Inscripción al evento">
            <div className="rounded-xl border border-dark-200 bg-dark-50/40 p-6 dark:border-dark-700 dark:bg-dark-900/40">
              <div className="flex items-center gap-2">
                <BadgeDollarSign className="h-5 w-5 text-primary-500" aria-hidden="true" />
                <h2 className="font-serif text-heading-lg font-semibold text-dark-900 dark:text-dark-100">
                  Costo de inscripción
                </h2>
              </div>

              <p className="mt-3 text-display-sm font-semibold text-dark-900 dark:text-dark-100">
                {priceLabel}
              </p>

              <p className="mt-2 text-caption text-dark-400 dark:text-dark-500">
                {course.type === 'TALK' ? 'Charla' : 'Evento'} de la Iglesia Proyecto Timoteo Lima. Al inscribirte desbloqueas el enlace de reunión y la grabación.
              </p>

              <div className="mt-6">
                {!isAuthenticated ? (
                  <Button size="xl" className="w-full" onClick={() => openLoginModal('login')}>
                    <LogIn className="mr-2 h-4 w-4" aria-hidden="true" />
                    Inicia sesión para inscribirte
                  </Button>
                ) : canAccess ? (
                  <div className="rounded-lg bg-green-50 px-4 py-3 text-body-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">
                    <CheckCircle2 className="mr-1.5 inline h-4 w-4" aria-hidden="true" />
                    {purchase?.method === 'FREE'
                      ? 'Inscripción confirmada ✓'
                      : `Inscripción pagada ✓ (${purchase?.currency === 'USD' ? `US$ ${purchase?.amount}` : `S/ ${purchase?.amount}`})`}
                  </div>
                ) : (
                  <Button
                    size="xl"
                    className="w-full"
                    onClick={() => setCheckoutOpen(true)}
                  >
                    <Lock className="mr-2 h-4 w-4" aria-hidden="true" />
                    {isFreeEvent ? 'Inscribirme gratis' : `Inscribirme · ${priceLabel}`}
                  </Button>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}

      {checkoutOpen && (
        <EventCheckoutModal
          course={course}
          onClose={() => setCheckoutOpen(false)}
          onSuccess={(p, enrolled) => {
            setPurchase(p);
            addEnrolledCourse(course.id);
            void enrolled;
          }}
        />
      )}
    </div>
  );
}