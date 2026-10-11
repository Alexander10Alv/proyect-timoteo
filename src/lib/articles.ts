import type { Article } from '@/types';

function parseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as string[]) : [raw];
    } catch {
      return raw ? [raw] : [];
    }
  }
  return [];
}

/**
 * Convierte un artículo crudo de Prisma/API al DTO del frontend:
 * normaliza el campo `tags` (JSON string en MySQL) a array de strings.
 */
export function toArticleDto(article: Record<string, unknown>): Article {
  return {
    id: String(article.id),
    title: String(article.title),
    slug: String(article.slug),
    excerpt: article.excerpt != null ? String(article.excerpt) : null,
    coverImage: article.coverImage != null ? String(article.coverImage) : null,
    content: String(article.content),
    status: (article.status as Article['status']) ?? 'DRAFT',
    publishedAt: article.publishedAt != null ? String(article.publishedAt) : null,
    createdById: article.createdById != null ? String(article.createdById) : null,
    createdBy:
      (article.createdBy as Article['createdBy']) ??
      (null as Article['createdBy']),
    categoryId: article.categoryId != null ? String(article.categoryId) : null,
    category: (article.category as Article['category']) ?? null,
    tags: parseTags(article.tags),
    createdAt: String(article.createdAt),
    updatedAt: String(article.updatedAt),
  };
}