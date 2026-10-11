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

/** PUT /api/admin/missionaries/[id]/stories/[storyId] — actualiza una historia (solo admin). */
export async function PUT(request: NextRequest, { params }: { params: { id: string; storyId: string } }) {
  const auth = await requireAdmin(request);
  if (!('user' in auth)) return auth;

  try {
    const missionaryId = optInt(params.id);
    const storyId = optInt(params.storyId);
    const existing = await prisma.missionaryStory.findFirst({
      where: { id: storyId ?? 0, missionaryId: missionaryId ?? 0 },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Historia no encontrada.' }, { status: 404 });
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

    const story = await prisma.missionaryStory.update({
      where: { id: storyId ?? 0 },
      data: {
        title,
        body: text,
        storyDate: optDate(body.storyDate),
        order: optStr(body.order) !== null ? (optInt(body.order) ?? existing.order) : existing.order,
      },
    });

    return NextResponse.json({ story: serializeStory(story) });
  } catch (error) {
    console.error('[PUT /api/admin/missionaries/:id/stories/:storyId]', error);
    return NextResponse.json({ error: 'Error interno al actualizar la historia.' }, { status: 500 });
  }
}

/** DELETE /api/admin/missionaries/[id]/stories/[storyId] — elimina una historia (solo admin). */
export async function DELETE(request: NextRequest, { params }: { params: { id: string; storyId: string } }) {
  const auth = await requireAdmin(request);
  if (!('user' in auth)) return auth;

  try {
    const missionaryId = optInt(params.id);
    const storyId = optInt(params.storyId);
    const existing = await prisma.missionaryStory.findFirst({
      where: { id: storyId ?? 0, missionaryId: missionaryId ?? 0 },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Historia no encontrada.' }, { status: 404 });
    }

    await prisma.missionaryStory.delete({ where: { id: storyId ?? 0 } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[DELETE /api/admin/missionaries/:id/stories/:storyId]', error);
    return NextResponse.json({ error: 'Error interno al eliminar la historia.' }, { status: 500 });
  }
}