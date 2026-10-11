import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { serializeJpCountry } from '@/lib/jpSerializer';
import { asStr, asInt, optStr, optFloat, asBigInt } from '@/lib/adminUtils';

/** GET /api/admin/countries — lista países (solo admin). */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!('user' in auth)) return auth;

  const countries = await prisma.country.findMany({
    orderBy: { countryName: 'asc' },
    include: {
      _count: { select: { peopleGroups: true, provinces: true, ministries: true } },
    },
  });

  return NextResponse.json({
    countries: countries.map((c) => ({
      ...serializeJpCountry(c),
      peopleGroupsCount: c._count.peopleGroups,
      provincesCount: c._count.provinces,
      ministriesCount: c._count.ministries,
    })),
  });
}

/** POST /api/admin/countries — crea un país (solo admin). */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!('user' in auth)) return auth;

  try {
    const body = await request.json();
    const countryCode = asStr(body.countryCode).toUpperCase();
    const countryName = asStr(body.countryName);

    if (!countryCode || !countryName) {
      return NextResponse.json(
        { error: 'countryCode y countryName son obligatorios.' },
        { status: 400 }
      );
    }
    if (!/^[A-Z]{2}$/.test(countryCode)) {
      return NextResponse.json(
        { error: 'countryCode debe ser ISO-2 (ej. "PE", "IN").' },
        { status: 400 }
      );
    }
    if (countryName.length < 2) {
      return NextResponse.json({ error: 'countryName debe tener al menos 2 caracteres.' }, { status: 400 });
    }

    const existing = await prisma.country.findUnique({ where: { countryCode } });
    if (existing) {
      return NextResponse.json({ error: `El país ${countryCode} ya existe.` }, { status: 409 });
    }

    const country = await prisma.country.create({
      data: {
        countryCode,
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

    return NextResponse.json({ country: serializeJpCountry(country) }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/admin/countries]', error);
    return NextResponse.json({ error: 'Error interno al crear el país.' }, { status: 500 });
  }
}