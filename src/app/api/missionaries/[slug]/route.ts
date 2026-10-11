import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeMissionary } from '@/lib/missionarySerializer';

/** GET /api/missionaries/[slug] — detalle de un misionero activo (público). */
export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  try {
    const missionary = await prisma.missionary.findUnique({
      where: { slug: params.slug },
      include: {
        country: { select: { countryName: true } },
        peopleGroup: { select: { peopleName: true } },
        stories: { orderBy: { order: 'asc' } },
      },
    });

    if (!missionary || missionary.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Misionero no encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ missionary: serializeMissionary(missionary) });
  } catch (error) {
    console.error('[GET /api/missionaries/:slug]', error);
    return NextResponse.json({ error: 'Error interno al leer el misionero.' }, { status: 500 });
  }
}