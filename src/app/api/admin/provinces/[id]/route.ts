import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { serializeProvince } from '@/lib/jpSerializer';
import { asStr, optInt, optBigInt } from '@/lib/adminUtils';

/** PUT /api/admin/provinces/[id] — actualiza una provincia (solo admin). */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(request);
  if (!('user' in auth)) return auth;

  try {
    const provinceId = params.id;
    const existing = await prisma.province.findUnique({ where: { provinceId } });
    if (!existing) {
      return NextResponse.json({ error: 'La provincia no existe.' }, { status: 404 });
    }

    const body = await request.json();
    const provinceName = asStr(body.provinceName);
    const countryCode = asStr(body.countryCode).toUpperCase();

    if (!provinceName || !countryCode) {
      return NextResponse.json({ error: 'provinceName y countryCode son obligatorios.' }, { status: 400 });
    }

    const country = await prisma.country.findUnique({ where: { countryCode } });
    if (!country) {
      return NextResponse.json({ error: `El país ${countryCode} no existe.` }, { status: 400 });
    }

    const province = await prisma.province.update({
      where: { provinceId },
      data: {
        provinceName,
        countryCode,
        population: optBigInt(body.population),
        unreachedCount: optInt(body.unreachedCount),
      },
    });

    return NextResponse.json({ province: serializeProvince(province) });
  } catch (error) {
    console.error('[PUT /api/admin/provinces/:id]', error);
    return NextResponse.json({ error: 'Error interno al actualizar la provincia.' }, { status: 500 });
  }
}

/** DELETE /api/admin/provinces/[id] — elimina una provincia (solo admin). */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(request);
  if (!('user' in auth)) return auth;

  try {
    const existing = await prisma.province.findUnique({ where: { provinceId: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'La provincia no existe.' }, { status: 404 });
    }
    await prisma.province.delete({ where: { provinceId: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[DELETE /api/admin/provinces/:id]', error);
    return NextResponse.json({ error: 'Error interno al eliminar la provincia.' }, { status: 500 });
  }
}