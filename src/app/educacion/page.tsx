'use client';

import * as React from 'react';
import { useAppStore } from '@/store';
import { useSiteStore } from '@/store/siteStore';
import { CourseCard } from '@/components/courses/CourseCard';
import { EducacionHero } from '@/components/hero/EducacionHero';
import { Skeleton } from '@/components/ui';
import { cn, getPostTypeLabel } from '@/lib/utils';
import type { PostType } from '@/types';
import { AlertTriangle } from 'lucide-react';

const FILTERS: Array<{ value: PostType | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Todo' },
  { value: 'COURSE', label: 'Cursos' },
  { value: 'TALK', label: 'Charlas' },
  { value: 'EVENT', label: 'Eventos' },
];

export default function EducacionPage() {
  const courses = useAppStore((s) => s.courses);
  const fetchCourses = useAppStore((s) => s.fetchCourses);
  const fetchUsers = useAppStore((s) => s.fetchUsers);
  const coursesLoading = useAppStore((s) => s.coursesLoading);
  const coursesError = useAppStore((s) => s.coursesError);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const user = useAppStore((s) => s.user);
  const subscriptions = useAppStore((s) => s.subscriptions);

  const educacionHero = useSiteStore((s) => s.sections.educacionHero) ?? {};

  const [filter, setFilter] = React.useState<PostType | 'ALL'>('ALL');
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    void fetchCourses();
    if (isAuthenticated) void fetchUsers();
  }, [fetchCourses, fetchUsers, isAuthenticated]);

  const enrolledItems = React.useMemo(() => {
    if (!isAuthenticated || !user) return [];
    const sub = subscriptions.find((s) => s.userId === user.id);
    if (!sub) return [];
    const ids = new Set(sub.enrolledCourses);
    return courses.filter((c) => ids.has(c.id));
  }, [isAuthenticated, user, subscriptions, courses]);

  const filtered = React.useMemo(() => {
    let list = courses;
    if (filter !== 'ALL') list = list.filter((c) => c.type === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          (c.authorName ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [courses, filter, query]);

  return (
    <>
      <EducacionHero
        courseIds={educacionHero.courseIds ?? []}
        media={educacionHero.media}
        buttonColors={educacionHero.buttonColors}
        eyebrow={educacionHero.eyebrow}
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-10">
        <p className="text-caption uppercase tracking-[0.25em] text-primary-600 dark:text-primary-400">
          Muro Educativo
        </p>
        <h1 className="mt-3 font-serif text-display-lg font-semibold text-dark-900 dark:text-dark-100">
          Cursos, charlas y eventos
        </h1>
        <p className="mt-4 max-w-2xl text-body-lg text-dark-500 dark:text-dark-400">
          Abre cualquier publicación para ver sus clases y grabaciones en el reproductor
          integrado, con lista de reproducción y recursos descargables.
        </p>
      </header>

      {isAuthenticated && (
        <section aria-label="Mis inscripciones" className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <h2 className="font-serif text-heading-md font-semibold text-dark-900 dark:text-dark-100">
              Mis inscripciones
            </h2>
            <span className="rounded-full bg-primary-600/10 px-3 py-1 text-caption font-semibold text-primary-700 dark:bg-primary-400/15 dark:text-primary-300">
              {enrolledItems.length}
            </span>
          </div>
          {enrolledItems.length === 0 ? (
            <p className="rounded-xl border border-dashed border-dark-300 bg-dark-50 px-5 py-6 text-body-sm text-dark-500 dark:border-dark-600 dark:bg-dark-800/40 dark:text-dark-400">
              Aún no estás inscrito a ninguna charla o evento. Explora el muro e inscríbete desde su página.
            </p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {enrolledItems.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </section>
      )}

      {coursesError && (
        <div role="alert" className="mb-8 flex items-start gap-3 rounded-xl bg-amber-50 px-5 py-4 dark:bg-amber-900/20">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" aria-hidden="true" />
          <p className="text-body-sm text-amber-700 dark:text-amber-300">{coursesError}</p>
        </div>
      )}

      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Filtrar publicaciones" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              role="tab"
              aria-selected={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'rounded-full px-4 py-2 text-body-sm font-medium transition-colors',
                filter === f.value
                  ? 'bg-dark-900 text-white dark:bg-white dark:text-dark-900'
                  : 'bg-dark-100 text-dark-600 hover:bg-dark-200 dark:bg-dark-800 dark:text-dark-300 dark:hover:bg-dark-700'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <input
          type="search"
          placeholder="Buscar..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar publicaciones"
          className="w-full max-w-xs rounded-lg border border-dark-300 bg-white px-4 py-2.5 text-body-sm placeholder-dark-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-dark-600 dark:bg-dark-900 dark:text-dark-100 sm:w-auto"
        />
      </div>

      {coursesLoading && courses.length === 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton variant="rectangular" className="aspect-[16/9]" />
              <Skeleton variant="text" width="3/4" />
              <Skeleton variant="text" width="1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <h3 className="font-serif text-heading-lg font-semibold text-dark-900 dark:text-dark-100">
            {courses.length === 0 ? 'Aún no hay publicaciones' : `Sin resultados para «${query}»`}
          </h3>
          <p className="mt-2 text-body-md text-dark-500 dark:text-dark-400">
            {courses.length === 0
              ? `Los cursos publicados por el equipo aparecerán aquí. Ejecuta npm run db:seed para cargar contenido de ejemplo (${getPostTypeLabel('COURSE')}s, charlas y eventos).`
              : 'Prueba con otros términos o cambia el filtro activo.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
      </div>
    </>
  );
}