import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: { id: string };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * PUT /api/categories/[id]
 * Renombra una categoría (actualiza nombre y slug).
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const existing = await prisma.category.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Categoría no encontrada.' }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const name = String(body?.name ?? '').trim();
    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'El nombre es requerido (mínimo 2 caracteres).' }, { status: 400 });
    }

    const slug = slugify(name);
    if (!slug) {
      return NextResponse.json({ error: 'Nombre inválido.' }, { status: 400 });
    }

    const conflict = await prisma.category.findFirst({
      where: { slug, id: { not: params.id } },
    });
    if (conflict) {
      return NextResponse.json({ error: 'Ya existe una categoría con ese nombre.' }, { status: 409 });
    }

    const category = await prisma.category.update({
      where: { id: params.id },
      data: { name, slug },
    });
    return NextResponse.json({ category });
  } catch (error) {
    console.error('[PUT /api/categories/:id]', error);
    return NextResponse.json({ error: 'Error interno al editar la categoría.' }, { status: 500 });
  }
}

/**
 * DELETE /api/categories/[id]
 * Eliminación SUAVE: oculta la categoría de la interfaz (active=false).
 * Los artículos asociados NO se tocan (no quedan huérfanos físicamente);
 * la responsabilidad de reasignarlos es del usuario, desde el editor.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const existing = await prisma.category.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Categoría no encontrada.' }, { status: 404 });
    }
    if (!existing.active) {
      return NextResponse.json({ error: 'La categoría ya está oculta.' }, { status: 400 });
    }

    const category = await prisma.category.update({
      where: { id: params.id },
      data: { active: false },
    });
    return NextResponse.json({ category });
  } catch (error) {
    console.error('[DELETE /api/categories/:id]', error);
    return NextResponse.json({ error: 'Error interno al ocultar la categoría.' }, { status: 500 });
  }
}