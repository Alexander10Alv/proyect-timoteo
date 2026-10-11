import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { serializeMissionary } from '@/lib/missionarySerializer';
import { asStr, optStr } from '@/lib/adminUtils';
import { slugify } from '@/lib/utils';

const STATUSES = ['ACTIVE', 'INACTIVE'] as const;
type MissionaryStatus = (typeof STATUSES)[number];

async function uniqueSlug(base: string): Promise<string> {
  const first = base || 'misionero';
  let candidate = first;
  let i = 2;
  while (await prisma.missionary.findUnique({ where: { slug: candidate } })) {
    candidate = `${first}-${i}`;
    i += 1;
  }
  return candidate;
}

/** GET /api/admin/missionaries — lista misioneros (solo admin). */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!('user' in auth)) return auth;

  const missionaries = await prisma.missionary.findMany({
    orderBy: { name: 'asc' },
    include: {
      country: { select: { countryName: true } },
      peopleGroup: { select: { peopleName: true } },
      stories: { orderBy: { order: 'asc' } },
    },
  });

  return NextResponse.json({ missionaries: missionaries.map(serializeMissionary) });
}

/** POST /api/admin/missionaries — crea un misionero (solo admin). */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!('user' in auth)) return auth;

  try {
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

    const missionary = await prisma.missionary.create({
      data: {
        name,
        role: optStr(body.role),
        slug: await uniqueSlug(slugify(name)),
        bio: optStr(body.bio),
        photoUrl: optStr(body.photoUrl),
        videoUrl: optStr(body.videoUrl),
        status: status as MissionaryStatus,
        countryCode,
        peopCode,
      },
    });

    return NextResponse.json({ missionary: serializeMissionary(missionary) }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/admin/missionaries]', error);
    return NextResponse.json({ error: 'Error interno al crear el misionero.' }, { status: 500 });
  }
}