import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { serializeMinistry } from '@/lib/jpSerializer';
import { asStr, optStr } from '@/lib/adminUtils';

/** GET /api/admin/ministries — lista ministerios (solo admin). */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!('user' in auth)) return auth;

  const ministries = await prisma.ministry.findMany({
    orderBy: { ministryName: 'asc' },
    select: {
      id: true,
      ministryName: true,
      ministryType: true,
      countryCode: true,
      peopCode: true,
      contactInfo: true,
      country: { select: { countryName: true } },
    },
  });

  return NextResponse.json({
    ministries: ministries.map((m) => {
      const { country, ...rest } = m;
      return { ...serializeMinistry(rest), countryName: country?.countryName ?? null };
    }),
  });
}

/** POST /api/admin/ministries — crea un ministerio (solo admin). */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!('user' in auth)) return auth;

  try {
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

    const ministry = await prisma.ministry.create({
      data: {
        ministryName,
        ministryType: optStr(body.ministryType),
        countryCode,
        peopCode,
        contactInfo: optStr(body.contactInfo),
      },
    });

    return NextResponse.json({ ministry: serializeMinistry(ministry) }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/admin/ministries]', error);
    return NextResponse.json({ error: 'Error interno al crear el ministerio.' }, { status: 500 });
  }
}