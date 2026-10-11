import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { serializeMinistry } from '@/lib/jpSerializer';
import { asStr, optStr } from '@/lib/adminUtils';

/** PUT /api/admin/ministries/[id] — actualiza un ministerio (solo admin). */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(request);
  if (!('user' in auth)) return auth;

  try {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
    }

    const existing = await prisma.ministry.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'El ministerio no existe.' }, { status: 404 });
    }

    const body = await request.json();
    const ministryName = asStr(body.ministryName);
    if (!ministryName) {
      return NextResponse.json({ error: 'ministryName es obligatorio.' }, { status: 400 });
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

    const ministry = await prisma.ministry.update({
      where: { id },
      data: {
        ministryName,
        ministryType: optStr(body.ministryType),
        countryCode,
        peopCode,
        contactInfo: optStr(body.contactInfo),
      },
    });

    return NextResponse.json({ ministry: serializeMinistry(ministry) });
  } catch (error) {
    console.error('[PUT /api/admin/ministries/:id]', error);
    return NextResponse.json({ error: 'Error interno al actualizar el ministerio.' }, { status: 500 });
  }
}

/** DELETE /api/admin/ministries/[id] — elimina un ministerio (solo admin). */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(request);
  if (!('user' in auth)) return auth;

  try {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
    }

    const existing = await prisma.ministry.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'El ministerio no existe.' }, { status: 404 });
    }
    await prisma.ministry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[DELETE /api/admin/ministries/:id]', error);
    return NextResponse.json({ error: 'Error interno al eliminar el ministerio.' }, { status: 500 });
  }
}