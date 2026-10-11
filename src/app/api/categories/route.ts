import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/categories
 * Lista las categorías ACTIVAS (visibles en la web).
 * Con ?all=true devuelve todas (activas + archivadas) para el panel admin,
 * incluyendo el conteo de artículos de cada una.
 */
export async function GET(request: NextRequest) {
  try {
    const all = request.nextUrl.searchParams.get('all') === 'true';
    const categories = await prisma.category.findMany({
      where: all ? {} : { active: true },
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
      include: all ? { _count: { select: { articles: true } } } : undefined,
    });
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('[GET /api/categories]', error);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}

/**
 * POST /api/categories
 * Crea una nueva categoría.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body?.name ?? '').trim();
    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'El nombre es requerido (mínimo 2 caracteres).' }, { status: 400 });
    }
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: 'Ya existe una categoría con ese slug.' }, { status: 409 });
    }

    const category = await prisma.category.create({
      data: { name, slug },
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/categories]', error);
    return NextResponse.json({ error: 'Error interno al crear la categoría.' }, { status: 500 });
  }
}