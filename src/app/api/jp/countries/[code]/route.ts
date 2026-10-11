import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  serializeJpCountry,
  serializePeopleGroup,
  serializeProvince,
  serializeMinistry,
} from '@/lib/jpSerializer';
import { alpha2FromAlpha3 } from '@/lib/isoAlpha3';

interface RouteParams {
  params: { code: string };
}

/**
 * GET /api/jp/countries/[code]
 * Acepta ISO Alpha-3 (PER, usado por el mapa) o ISO 2 (PE).
 * Devuelve el país + sus PeopleGroups + Provincias + Ministries.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const countryCode = alpha2FromAlpha3(params.code);

    const country = await prisma.country.findUnique({
      where: { countryCode },
      include: {
        peopleGroups: { orderBy: [{ isUnreached: 'desc' }, { populationInCountry: 'desc' }] },
        provinces: { orderBy: { provinceName: 'asc' } },
        ministries: { orderBy: { ministryName: 'asc' } },
      },
    });

    if (!country) {
      return NextResponse.json(
        { error: `Sin datos Joshua Project para el código "${params.code}".` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      country: serializeJpCountry(country),
      peopleGroups: country.peopleGroups.map(serializePeopleGroup),
      provinces: country.provinces.map(serializeProvince),
      ministries: country.ministries.map(serializeMinistry),
    });
  } catch (error) {
    console.error('[GET /api/jp/countries/:code]', error);
    return NextResponse.json({ error: 'Error interno al obtener el perfil JP.' }, { status: 500 });
  }
}