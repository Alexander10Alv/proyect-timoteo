import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { serializeStory } from '@/lib/missionarySerializer';
import { asStr, optStr, optInt } from '@/lib/adminUtils';

function optDate(value: unknown): Date | null {
  if (value == null || String(value).trim() === '') return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** POST /api/admin/missionaries/[id]/stories — crea una historia para el misionero (solo admin). */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(request);
  if (!('user' in auth)) return auth;

  try {
    const missionaryId = optInt(params.id);
    if (missionaryId == null) {
      return NextResponse.json({ error: 'ID de misionero inválido.' }, { status: 400 });
    }
    const missionary = await prisma.missionary.findUnique({ where: { id: missionaryId } });
    if (!missionary) {
      return NextResponse.json({ error: 'Misionero no encontrado.' }, { status: 404 });
    }

    const body = await request.json();
    const title = asStr(body.title);
    const text = asStr(body.body);
    if (!title || !text) {
      return NextResponse.json(
        { error: 'El título y el contenido de la historia son obligatorios.' },
        { status: 400 }
      );
    }

    const last = await prisma.missionaryStory.findFirst({
      where: { missionaryId },
      orderBy: { order: 'desc' },
    });

    const story = await prisma.missionaryStory.create({
      data: {
        missionaryId,
        title,
        body: text,
        storyDate: optDate(body.storyDate),
        order: optInt(body.order) ?? (last ? last.order + 1 : 0),
      },
    });

    return NextResponse.json({ story: serializeStory(story) }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/admin/missionaries/:id/stories]', error);
    return NextResponse.json({ error: 'Error interno al crear la historia.' }, { status: 500 });
  }
}