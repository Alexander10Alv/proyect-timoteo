'use client';

import * as React from 'react';
import Link from 'next/link';
import { Badge, Skeleton } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import type { Article } from '@/types';
import { ArrowLeft, Calendar, User, Newspaper } from 'lucide-react';

export function ArticlePageContent({ slug }: { slug: string }) {
  const [article, setArticle] = React.useState<Article | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    fetch(`/api/articles/slug/${encodeURIComponent(slug)}`)
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data.article) {
          setNotFound(true);
          return;
        }
        setArticle(data.article);
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
        <Skeleton variant="text" className="mt-4" />
        <Skeleton variant="text" width="3/4" />
        <Skeleton variant="rectangular" className="mt-6 aspect-[16/9]" />
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <Newspaper className="mx-auto mb-4 h-12 w-12 text-dark-300 dark:text-dark-600" aria-hidden="true" />
        <h1 className="font-serif text-display-md font-semibold text-dark-900 dark:text-dark-100">
          Artículo no encontrado
        </h1>
        <p className="mt-3 text-body-md text-dark-500 dark:text-dark-400">
          El artículo que buscas no existe o aún no ha sido publicado.
        </p>
        <Link
          href="/articulos"
          className="mt-6 inline-flex items-center gap-2 font-medium text-primary-600 dark:text-primary-400"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a artículos
        </Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link
        href="/articulos"
        className="mb-8 inline-flex items-center gap-2 text-body-sm font-medium text-primary-600 dark:text-primary-400"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Todos los artículos
      </Link>

      <header className="mb-8">
        <div className="mb-4 flex flex-wrap items-center gap-3 text-caption text-dark-400 dark:text-dark-500">
          {article.category && (
            <Badge variant="primary" size="sm">{article.category.name}</Badge>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
            {formatDate(article.publishedAt ?? article.createdAt)}
          </span>
          {article.createdBy?.name && (
            <span className="inline-flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" aria-hidden="true" />
              {article.createdBy.name}
            </span>
          )}
        </div>

        <h1 className="font-serif text-display-md font-semibold leading-tight text-dark-900 dark:text-dark-100">
          {article.title}
        </h1>

        {article.excerpt && (
          <p className="mt-4 text-body-lg text-dark-500 dark:text-dark-400">{article.excerpt}</p>
        )}

        {article.coverImage && (
          <img
            src={article.coverImage}
            alt=""
            className="mt-8 aspect-[16/9] w-full rounded-xl object-cover"
          />
        )}
      </header>

      <div
        className="prose-custom"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      <footer className="mt-12 border-t border-dark-200 pt-6 dark:border-dark-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-caption uppercase tracking-wider text-dark-400 dark:text-dark-500">Tags:</span>
          {article.tags.length === 0 ? (
            <span className="text-caption text-dark-400 dark:text-dark-500">Sin etiquetas</span>
          ) : (
            article.tags.map((tag) => (
              <Link
                key={tag}
                href={`/articulos?q=${encodeURIComponent(tag)}`}
                className="rounded-full bg-dark-100 px-3 py-1 text-caption text-dark-600 transition-colors hover:bg-dark-200 dark:bg-dark-800 dark:text-dark-300 dark:hover:bg-dark-700"
              >
                #{tag}
              </Link>
            ))
          )}
        </div>
      </footer>
    </article>
  );
}