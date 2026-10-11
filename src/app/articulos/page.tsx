'use client';

import * as React from 'react';
import { useAppStore } from '@/store';
import { Skeleton } from '@/components/ui';
import { ArticleCard } from '@/components/articles/ArticleCard';
import { AlertTriangle, Newspaper } from 'lucide-react';

export default function ArticulosPage() {
  const articles = useAppStore((s) => s.articles);
  const categories = useAppStore((s) => s.categories);
  const fetchPublishedArticles = useAppStore((s) => s.fetchPublishedArticles);
  const fetchCategories = useAppStore((s) => s.fetchCategories);
  const articlesLoading = useAppStore((s) => s.articlesLoading);

  const [query, setQuery] = React.useState('');
  const [categorySlug, setCategorySlug] = React.useState('ALL');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    void fetchCategories();
    const params = new URLSearchParams(window.location.search);
    const categoria = params.get('categoria');
    const q = params.get('q');
    if (categoria) setCategorySlug(categoria);
    if (q) setQuery(q);
    fetchPublishedArticles()
      .then((list) => {
        useAppStore.setState({ articles: list });
        setError(null);
      })
      .catch(() => setError('No se pudieron cargar los artículos.'));
  }, [fetchCategories, fetchPublishedArticles]);

  const filtered = React.useMemo(() => {
    let list = articles.filter((a) => a.status === 'PUBLISHED');
    if (categorySlug !== 'ALL') list = list.filter((a) => a.category?.slug === categorySlug);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.excerpt ?? '').toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [articles, categorySlug, query]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10">
        <p className="text-caption uppercase tracking-[0.25em] text-primary-600 dark:text-primary-400">
          Blog y recursos
        </p>
        <h1 className="mt-3 font-serif text-display-lg font-semibold text-dark-900 dark:text-dark-100">
          Artículos
        </h1>
        <p className="mt-4 max-w-2xl text-body-lg text-dark-500 dark:text-dark-400">
          Reflexiones, guías y recursos del equipo de Proyecto Timoteo sobre evangelismo,
          oración y los pueblos no alcanzados.
        </p>
      </header>

      {error && (
        <div role="alert" className="mb-8 flex items-start gap-3 rounded-xl bg-amber-50 px-5 py-4 dark:bg-amber-900/20">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" aria-hidden="true" />
          <p className="text-body-sm text-amber-700 dark:text-amber-300">{error}</p>
        </div>
      )}

      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Filtrar por categoría" className="flex flex-wrap gap-2">
          <button
            role="tab"
            aria-selected={categorySlug === 'ALL'}
            onClick={() => setCategorySlug('ALL')}
            className={
              categorySlug === 'ALL'
                ? 'rounded-full px-4 py-2 text-body-sm font-medium transition-colors bg-dark-900 text-white dark:bg-white dark:text-dark-900'
                : 'rounded-full px-4 py-2 text-body-sm font-medium transition-colors bg-dark-100 text-dark-600 hover:bg-dark-200 dark:bg-dark-800 dark:text-dark-300 dark:hover:bg-dark-700'
            }
          >
            Todos
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={categorySlug === c.slug}
              onClick={() => setCategorySlug(c.slug)}
              className={
                categorySlug === c.slug
                  ? 'rounded-full px-4 py-2 text-body-sm font-medium transition-colors bg-dark-900 text-white dark:bg-white dark:text-dark-900'
                  : 'rounded-full px-4 py-2 text-body-sm font-medium transition-colors bg-dark-100 text-dark-600 hover:bg-dark-200 dark:bg-dark-800 dark:text-dark-300 dark:hover:bg-dark-700'
              }
            >
              {c.name}
            </button>
          ))}
        </div>

        <input
          type="search"
          placeholder="Buscar artículos..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar artículos"
          className="w-full max-w-xs rounded-lg border border-dark-300 bg-white px-4 py-2.5 text-body-sm placeholder-dark-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-dark-600 dark:bg-dark-900 dark:text-dark-100 sm:w-auto"
        />
      </div>

      {articlesLoading && filtered.length === 0 ? (
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
          <Newspaper className="mx-auto mb-3 h-10 w-10 text-dark-300 dark:text-dark-600" aria-hidden="true" />
          <h3 className="font-serif text-heading-lg font-semibold text-dark-900 dark:text-dark-100">
            {articles.length === 0 ? 'Aún no hay artículos publicados' : `Sin resultados para «${query}»`}
          </h3>
          <p className="mt-2 text-body-md text-dark-500 dark:text-dark-400">
            {articles.length === 0
              ? 'Los artículos publicados por el equipo aparecerán aquí.'
              : 'Prueba con otros términos o cambia la categoría activa.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}