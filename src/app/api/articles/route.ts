import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { toArticleDto } from '@/lib/articles';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * GET /api/articles
 * Lista todos los artículos (cualquier estado), con paginación opcional.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? undefined;
    const categoria = searchParams.get('categoria') ?? undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    const where: Prisma.ArticleWhereInput = {};
    if (status) where.status = status as 'DRAFT' | 'PUBLISHED';
    if (categoria) {
      let category = await prisma.category.findUnique({ where: { slug: categoria } });
      if (!category && categoria === 'oraciones') {
        category = await prisma.category.create({ data: { name: 'Oraciones', slug: 'oraciones' } });
      }
      where.categoryId = category?.id ?? '\0';
    }

    const articles = await prisma.article.findMany({
      where,
      include: {
        createdBy: { select: { name: true, email: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      skip: offset,
    });

    const total = await prisma.article.count({ where });

    return NextResponse.json({
      articles: articles.map((a) => toArticleDto(a as unknown as Record<string, unknown>)),
      total,
      offset,
      limit,
    });
  } catch (error) {
    console.error('[GET /api/articles]', error);
    return NextResponse.json({ error: 'Error interno al listar artículos.' }, { status: 500 });
  }
}

/**
 * POST /api/articles
 * Crea un nuevo artículo.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = String(body?.title ?? '').trim();
    const content = String(body?.content ?? '').trim();
    const excerpt = body?.excerpt ? String(body.excerpt).trim() : null;
    const coverImage = body?.coverImage ? String(body.coverImage).trim() : null;
    const status = body?.status ? String(body.status) : 'DRAFT';
    const categoryId = body?.categoryId ? String(body.categoryId) : null;
    const tags = Array.isArray(body?.tags) ? body.tags : [];

    if (!title || title.length < 3) {
      return NextResponse.json({ error: 'El título es requerido (mínimo 3 caracteres).' }, { status: 400 });
    }
    if (!content) {
      return NextResponse.json({ error: 'El contenido es requerido.' }, { status: 400 });
    }

    const slug = slugify(title);
    const existingSlug = await prisma.article.findUnique({ where: { slug } });
    if (existingSlug) {
      return NextResponse.json({ error: 'Ya existe un artículo con ese slug.' }, { status: 409 });
    }

    const publishedAt = status === 'PUBLISHED' ? new Date() : null;

    const article = await prisma.article.create({
      data: {
        title,
        slug,
        excerpt,
        coverImage,
        content,
        status: status as 'DRAFT' | 'PUBLISHED',
        publishedAt,
        categoryId,
        tags: JSON.stringify(tags),
      },
      include: {
        createdBy: { select: { name: true, email: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json(
      { article: toArticleDto(article as unknown as Record<string, unknown>) },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/articles]', error);
    return NextResponse.json({ error: 'Error interno al crear el artículo.' }, { status: 500 });
  }
}