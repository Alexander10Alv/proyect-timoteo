import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeJpCountry } from '@/lib/jpSerializer';

/**
 * GET /api/jp/countries
 * Lista todos los países de la estructura completa Joshua Project.
 */
export async function GET() {
  try {
    const countries = await prisma.country.findMany({
      orderBy: { countryName: 'asc' },
      include: {
        peopleGroups: {
          orderBy: { populationInCountry: 'desc' },
          take: 1,
          select: { primaryLanguage: true, primaryReligion: true },
        },
      },
    });
    return NextResponse.json({
      countries: countries.map((c) => {
        const largestGroup = c.peopleGroups[0];
        return {
          ...serializeJpCountry(c),
          primaryLanguage: largestGroup?.primaryLanguage ?? undefined,
          primaryReligion: largestGroup?.primaryReligion ?? undefined,
        };
      }),
    });
  } catch (error) {
    console.error('[GET /api/jp/countries]', error);
    return NextResponse.json({ error: 'Error interno al listar países JP.' }, { status: 500 });
  }
}