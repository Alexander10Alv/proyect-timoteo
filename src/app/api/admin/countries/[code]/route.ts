import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { serializeJpCountry } from '@/lib/jpSerializer';
import { asStr, optStr, optFloat, asBigInt, asInt } from '@/lib/adminUtils';

/** PUT /api/admin/countries/[code] — actualiza un país (solo admin). */
export async function PUT(request: NextRequest, { params }: { params: { code: string } }) {
  const auth = await requireAdmin(request);
  if (!('user' in auth)) return auth;

  try {
    const countryCode = params.code.toUpperCase();
    const existing = await prisma.country.findUnique({ where: { countryCode } });
    if (!existing) {
      return NextResponse.json({ error: `El país ${countryCode} no existe.` }, { status: 404 });
    }

    const body = await request.json();
    const countryName = asStr(body.countryName);
    if (countryName.length < 2) {
      return NextResponse.json({ error: 'countryName debe tener al menos 2 caracteres.' }, { status: 400 });
    }

    const country = await prisma.country.update({
      where: { countryCode },
      data: {
        countryName,
        totalPeopleGroups: asInt(body.totalPeopleGroups),
        unreachedPeopleGroups: asInt(body.unreachedPeopleGroups),
        unreachedPct: optFloat(body.unreachedPct) ?? 0,
        frontierPeopleGroups: asInt(body.frontierPeopleGroups),
        frontierPct: optFloat(body.frontierPct) ?? 0,
        totalPopulation: asBigInt(body.totalPopulation),
        unreachedPopulation: asBigInt(body.unreachedPopulation),
        frontierPopulation: asBigInt(body.frontierPopulation),
        christianAdherentsPct: optFloat(body.christianAdherentsPct) ?? 0,
        evangelicalPct: optFloat(body.evangelicalPct) ?? 0,
        flagUrl: optStr(body.flagUrl),
        heroImage: optStr(body.heroImage),
      },
    });

    return NextResponse.json({ country: serializeJpCountry(country) });
  } catch (error) {
    console.error('[PUT /api/admin/countries/:code]', error);
    return NextResponse.json({ error: 'Error interno al actualizar el país.' }, { status: 500 });
  }
}

/** DELETE /api/admin/countries/[code] — elimina un país (solo admin). */
export async function DELETE(request: NextRequest, { params }: { params: { code: string } }) {
  const auth = await requireAdmin(request);
  if (!('user' in auth)) return auth;

  try {
    const countryCode = params.code.toUpperCase();
    const existing = await prisma.country.findUnique({ where: { countryCode } });
    if (!existing) {
      return NextResponse.json({ error: `El país ${countryCode} no existe.` }, { status: 404 });
    }

    await prisma.country.delete({ where: { countryCode } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[DELETE /api/admin/countries/:code]', error);
    return NextResponse.json({ error: 'Error interno al eliminar el país.' }, { status: 500 });
  }
}