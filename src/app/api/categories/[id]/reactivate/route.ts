import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: { id: string };
}

/**
 * POST /api/categories/[id]/reactivate
 * Vuelve a mostrar una categoría archivada (active=true).
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const existing = await prisma.category.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Categoría no encontrada.' }, { status: 404 });
    }

    const category = await prisma.category.update({
      where: { id: params.id },
      data: { active: true },
    });
    return NextResponse.json({ category });
  } catch (error) {
    console.error('[POST /api/categories/:id/reactivate]', error);
    return NextResponse.json({ error: 'Error interno al reactivar la categoría.' }, { status: 500 });
  }
}