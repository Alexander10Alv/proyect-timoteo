import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toArticleDto } from '@/lib/articles';

interface RouteParams {
  params: { slug: string };
}

/**
 * GET /api/articles/slug/[slug]
 * Devuelve un artículo publicado por su slug.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const article = await prisma.article.findUnique({
      where: { slug: params.slug, status: 'PUBLISHED' },
      include: {
        createdBy: { select: { name: true, email: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!article) {
      return NextResponse.json({ error: 'Artículo no encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ article: toArticleDto(article as unknown as Record<string, unknown>) });
  } catch (error) {
    console.error('[GET /api/articles/slug/:slug]', error);
    return NextResponse.json({ error: 'Error interno al obtener el artículo.' }, { status: 500 });
  }
}