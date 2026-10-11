import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toArticleDto } from '@/lib/articles';

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/articles/[id]
 * Devuelve un artículo por ID.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const article = await prisma.article.findUnique({
      where: { id: params.id },
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
    console.error('[GET /api/articles/:id]', error);
    return NextResponse.json({ error: 'Error interno al obtener el artículo.' }, { status: 500 });
  }
}

/**
 * PUT /api/articles/[id]
 * Actualiza el artículo.
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const body = await request.json();
    const title = String(body?.title ?? '').trim();
    const content = String(body?.content ?? '').trim();
    const excerpt = body?.excerpt ? String(body.excerpt).trim() : null;
    const coverImage = body?.coverImage ? String(body.coverImage).trim() : null;
    const status = body?.status ? String(body.status) : undefined;
    const categoryId = body?.categoryId ? String(body.categoryId) : null;
    const tags = Array.isArray(body?.tags) ? body.tags : undefined;

    if (!title || title.length < 3) {
      return NextResponse.json({ error: 'El título es requerido (mínimo 3 caracteres).' }, { status: 400 });
    }
    if (!content) {
      return NextResponse.json({ error: 'El contenido es requerido.' }, { status: 400 });
    }

    const existing = await prisma.article.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Artículo no encontrado.' }, { status: 404 });
    }

    const data: Record<string, unknown> = {
      title,
      content,
      excerpt,
      coverImage: coverImage ?? null,
      categoryId,
    };

    if (status) {
      data.status = status;
      data.publishedAt = status === 'PUBLISHED' ? new Date() : existing.publishedAt;
    }

    if (tags !== undefined) {
      data.tags = JSON.stringify(tags);
    }

    const article = await prisma.article.update({
      where: { id: params.id },
      data,
      include: {
        createdBy: { select: { name: true, email: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json({ article: toArticleDto(article as unknown as Record<string, unknown>) });
  } catch (error) {
    console.error('[PUT /api/articles/:id]', error);
    return NextResponse.json({ error: 'Error interno al actualizar el artículo.' }, { status: 500 });
  }
}

/**
 * DELETE /api/articles/[id]
 * Elimina el artículo.
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const existing = await prisma.article.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Artículo no encontrado.' }, { status: 404 });
    }

    await prisma.article.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[DELETE /api/articles/:id]', error);
    return NextResponse.json({ error: 'Error interno al eliminar el artículo.' }, { status: 500 });
  }
}