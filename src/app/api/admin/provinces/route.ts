import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { serializeProvince } from '@/lib/jpSerializer';
import { asStr, optInt, optBigInt } from '@/lib/adminUtils';

/** GET /api/admin/provinces — lista provincias (solo admin). */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!('user' in auth)) return auth;

  const provinces = await prisma.province.findMany({
    orderBy: { provinceName: 'asc' },
    select: {
      provinceId: true,
      provinceName: true,
      countryCode: true,
      population: true,
      unreachedCount: true,
      country: { select: { countryName: true } },
    },
  });

  return NextResponse.json({
    provinces: provinces.map((p) => {
      const { country, ...rest } = p;
      return { ...serializeProvince(rest), countryName: country?.countryName ?? null };
    }),
  });
}

/** POST /api/admin/provinces — crea una provincia (solo admin). */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!('user' in auth)) return auth;

  try {
    const body = await request.json();
    const provinceId = asStr(body.provinceId);
    const provinceName = asStr(body.provinceName);
    const countryCode = asStr(body.countryCode).toUpperCase();

    if (!provinceId || !provinceName || !countryCode) {
      return NextResponse.json(
        { error: 'provinceId, provinceName y countryCode son obligatorios.' },
        { status: 400 }
      );
    }

    const country = await prisma.country.findUnique({ where: { countryCode } });
    if (!country) {
      return NextResponse.json({ error: `El país ${countryCode} no existe.` }, { status: 400 });
    }
    const existing = await prisma.province.findUnique({ where: { provinceId } });
    if (existing) {
      return NextResponse.json({ error: `La provincia ${provinceId} ya existe.` }, { status: 409 });
    }

    const province = await prisma.province.create({
      data: {
        provinceId,
        provinceName,
        countryCode,
        population: optBigInt(body.population),
        unreachedCount: optInt(body.unreachedCount),
      },
    });

    return NextResponse.json({ province: serializeProvince(province) }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/admin/provinces]', error);
    return NextResponse.json({ error: 'Error interno al crear la provincia.' }, { status: 500 });
  }
}