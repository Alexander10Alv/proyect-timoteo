import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { serializeMissionary } from '@/lib/missionarySerializer';
import { asStr, optStr, asInt } from '@/lib/adminUtils';

const STATUSES = ['ACTIVE', 'INACTIVE'] as const;
type MissionaryStatus = (typeof STATUSES)[number];

/** PUT /api/admin/missionaries/[id] — actualiza un misionero (solo admin). El slug se conserva estable. */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(request);
  if (!('user' in auth)) return auth;

  try {
    const id = asInt(params.id);
    const existing = await prisma.missionary.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Misionero no encontrado.' }, { status: 404 });
    }

    const body = await request.json();
    const name = asStr(body.name);
    if (!name) {
      return NextResponse.json({ error: 'El nombre del misionero es obligatorio.' }, { status: 400 });
    }

    const status = asStr(body.status);
    if (!STATUSES.includes(status as MissionaryStatus)) {
      return NextResponse.json({ error: 'status debe ser ACTIVE o INACTIVE.' }, { status: 400 });
    }

    const countryCode = optStr(body.countryCode)?.toUpperCase() ?? null;
    if (countryCode) {
      const country = await prisma.country.findUnique({ where: { countryCode } });
      if (!country) {
        return NextResponse.json({ error: `El país ${countryCode} no existe.` }, { status: 400 });
      }
    }

    const peopCode = optStr(body.peopCode);
    if (peopCode) {
      const group = await prisma.peopleGroup.findUnique({ where: { peopCode } });
      if (!group) {
        return NextResponse.json({ error: `El peopCode ${peopCode} no existe.` }, { status: 400 });
      }
    }

    const missionary = await prisma.missionary.update({
      where: { id },
      data: {
        name,
        role: optStr(body.role),
        bio: optStr(body.bio),
        photoUrl: optStr(body.photoUrl),
        videoUrl: optStr(body.videoUrl),
        status: status as MissionaryStatus,
        countryCode,
        peopCode,
      },
      include: {
        country: { select: { countryName: true } },
        peopleGroup: { select: { peopleName: true } },
        stories: { orderBy: { order: 'asc' } },
      },
    });

    return NextResponse.json({ missionary: serializeMissionary(missionary) });
  } catch (error) {
    console.error('[PUT /api/admin/missionaries/:id]', error);
    return NextResponse.json({ error: 'Error interno al actualizar el misionero.' }, { status: 500 });
  }
}

/** DELETE /api/admin/missionaries/[id] — elimina un misionero y sus historias (solo admin). */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(request);
  if (!('user' in auth)) return auth;

  try {
    const id = asInt(params.id);
    const existing = await prisma.missionary.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Misionero no encontrado.' }, { status: 404 });
    }

    await prisma.missionary.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[DELETE /api/admin/missionaries/:id]', error);
    return NextResponse.json({ error: 'Error interno al eliminar el misionero.' }, { status: 500 });
  }
}