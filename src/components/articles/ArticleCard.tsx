import Link from 'next/link';
import { cn, formatDate } from '@/lib/utils';
import type { Article } from '@/types';
import { ArrowRight, Newspaper } from 'lucide-react';

export function ArticleCard({ article, compact = false }: { article: Article; compact?: boolean }) {
  return (
    <Link
      href={`/articulos/${article.slug}`}
      className={cn(
        'group relative flex overflow-hidden rounded-2xl border border-dark-200 transition-all duration-300 hover:-translate-y-1 hover:border-primary-300 hover:shadow-xl hover:shadow-primary-100/80 dark:border-dark-700 dark:hover:border-primary-600 dark:hover:shadow-primary-950',
        compact ? 'flex-row items-center gap-3 p-3 md:flex-col md:items-stretch md:gap-0 md:p-0' : 'flex-col'
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-sky-500 to-primary-600 transition-transform duration-500 group-hover:scale-x-100"
      />

      <div
        className={cn(
          'relative overflow-hidden bg-dark-100 dark:bg-dark-800',
          compact ? 'aspect-[4/3] w-24 shrink-0 rounded-xl md:aspect-[16/9] md:w-full md:rounded-none' : 'aspect-[16/9]'
        )}
      >
        {article.coverImage ? (
          <img
            src={article.coverImage}
            alt=""
            className={cn(
              'h-full w-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:rotate-[0.5deg]',
              compact && 'md:h-full'
            )}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-500 to-primary-600 transition-transform duration-500 group-hover:scale-110">
            <Newspaper
              className={cn('text-white', compact ? 'h-6 w-6' : 'h-10 w-10')}
              aria-hidden="true"
            />
          </div>
        )}
        {article.coverImage && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        )}
        <span
          className={cn(
            'absolute bottom-2.5 right-2.5 z-10 hidden h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-primary-600 text-white shadow-lg opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 md:inline-flex translate-y-2'
          )}
        >
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>

      <div className={cn('relative z-10 flex min-w-0 flex-col', compact ? 'flex-1 md:p-5' : 'flex-1 p-5')}>
        <div
          className={cn(
            'flex items-center gap-2 text-caption text-dark-400 dark:text-dark-500',
            compact ? 'mb-1' : 'mb-2'
          )}
        >
          {article.category && (
            <span className="rounded-full bg-gradient-to-r from-sky-500 to-primary-600 px-2.5 py-0.5 font-semibold text-white shadow-sm shadow-primary-500/30 transition-transform duration-300 group-hover:scale-105">
              {article.category.name}
            </span>
          )}
          <time dateTime={article.publishedAt ?? article.createdAt}>
            {formatDate(article.publishedAt ?? article.createdAt)}
          </time>
        </div>

        <h2
          className={cn(
            'font-serif font-semibold leading-snug text-dark-900 transition-colors group-hover:text-primary-700 dark:text-dark-100 dark:group-hover:text-primary-300',
            compact ? 'text-heading-sm md:line-clamp-2 md:text-heading-md' : 'text-heading-md line-clamp-2'
          )}
        >
          <span className="bg-gradient-to-r from-sky-500 to-primary-600 bg-left-bottom bg-no-repeat [background-size:0%_2px] transition-[background-size] duration-500 group-hover:[background-size:100%_2px]">
            {article.title}
          </span>
        </h2>
        {article.excerpt && (
          <p
            className={cn(
              'mt-2 line-clamp-2 text-body-sm text-dark-500 dark:text-dark-400',
              compact && 'hidden md:block'
            )}
          >
            {article.excerpt}
          </p>
        )}

        <span
          className={cn(
            'inline-flex items-center gap-1 text-body-sm font-semibold text-primary-600 transition-colors group-hover:text-sky-600 dark:text-primary-400 dark:group-hover:text-sky-400',
            compact ? 'mt-1 hidden md:mt-4 md:inline-flex' : 'mt-4'
          )}
        >
          Leer artículo
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}