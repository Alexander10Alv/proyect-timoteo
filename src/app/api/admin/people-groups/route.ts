import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { serializePeopleGroup } from '@/lib/jpSerializer';
import { asStr, optStr, asInt, optInt, optFloat, optBigInt, asBool } from '@/lib/adminUtils';

/** GET /api/admin/people-groups — lista grupos étnicos (solo admin). */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!('user' in auth)) return auth;

  const groups = await prisma.peopleGroup.findMany({
    orderBy: { peopleName: 'asc' },
    select: {
      id: true,
      peopCode: true,
      countryCode: true,
      peopleName: true,
      populationInCountry: true,
      populationGlobal: true,
      isUnreached: true,
      isFrontier: true,
      isIndigenous: true,
      isDiaspora: true,
      primaryLanguage: true,
      primaryLanguageCode: true,
      primaryReligion: true,
      evangelicalPct: true,
      percentAdherents: true,
      progressScale: true,
      workersNeeded: true,
      countOfCountries: true,
      provinceRegion: true,
      description: true,
      photoUrl: true,
      latitude: true,
      longitude: true,
      country: { select: { countryName: true } },
    },
  });

  return NextResponse.json({
    peopleGroups: groups.map((g) => {
      const { country, ...rest } = g;
      return { ...serializePeopleGroup(rest), countryName: country?.countryName ?? null };
    }),
  });
}

/** POST /api/admin/people-groups — crea un grupo étnico (solo admin). */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!('user' in auth)) return auth;

  try {
    const body = await request.json();
    const peopCode = asStr(body.peopCode);
    const countryCode = asStr(body.countryCode).toUpperCase();
    const peopleName = asStr(body.peopleName);
    const primaryLanguage = asStr(body.primaryLanguage);
    const primaryReligion = asStr(body.primaryReligion);

    if (!peopCode || !countryCode || !peopleName || !primaryLanguage || !primaryReligion) {
      return NextResponse.json(
        { error: 'peopCode, countryCode, peopleName, primaryLanguage y primaryReligion son obligatorios.' },
        { status: 400 }
      );
    }

    const country = await prisma.country.findUnique({ where: { countryCode } });
    if (!country) {
      return NextResponse.json({ error: `El país ${countryCode} no existe.` }, { status: 400 });
    }
    const languageCode = optStr(body.primaryLanguageCode);
    if (languageCode) {
      const language = await prisma.language.findUnique({ where: { languageCode } });
      if (!language) {
        return NextResponse.json({ error: `El idioma ${languageCode} no existe. Créalo primero en la pestaña Idiomas.` }, { status: 400 });
      }
    }
    const existingCode = await prisma.peopleGroup.findUnique({ where: { peopCode } });
    if (existingCode) {
      return NextResponse.json({ error: `El código ${peopCode} ya existe.` }, { status: 409 });
    }

    const group = await prisma.peopleGroup.create({
      data: {
        peopCode,
        countryCode,
        peopleName,
        populationInCountry: asInt(body.populationInCountry),
        populationGlobal: optBigInt(body.populationGlobal),
        isUnreached: asBool(body.isUnreached),
        isFrontier: asBool(body.isFrontier),
        isIndigenous: asBool(body.isIndigenous),
        isDiaspora: asBool(body.isDiaspora),
        primaryLanguage,
        primaryLanguageCode: optStr(body.primaryLanguageCode),
        primaryReligion,
        evangelicalPct: optFloat(body.evangelicalPct),
        percentAdherents: optFloat(body.percentAdherents),
        progressScale: optFloat(body.progressScale),
        workersNeeded: optInt(body.workersNeeded),
        countOfCountries: optInt(body.countOfCountries),
        provinceRegion: optStr(body.provinceRegion),
        description: optStr(body.description),
        photoUrl: optStr(body.photoUrl),
      },
    });

    return NextResponse.json({ peopleGroup: serializePeopleGroup(group) }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/admin/people-groups]', error);
    return NextResponse.json({ error: 'Error interno al crear el grupo.' }, { status: 500 });
  }
}