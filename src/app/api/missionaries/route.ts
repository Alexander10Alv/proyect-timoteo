import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeMissionary } from '@/lib/missionarySerializer';

export const dynamic = 'force-dynamic';

/** GET /api/missionaries — lista misioneros activos (público). */
export async function GET() {
  try {
    const missionaries = await prisma.missionary.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
      include: {
        country: { select: { countryName: true } },
        peopleGroup: { select: { peopleName: true } },
      },
    });
    return NextResponse.json({ missionaries: missionaries.map(serializeMissionary) });
  } catch (error) {
    console.error('[GET /api/missionaries]', error);
    return NextResponse.json({ error: 'Error interno al listar misioneros.' }, { status: 500 });
  }
}