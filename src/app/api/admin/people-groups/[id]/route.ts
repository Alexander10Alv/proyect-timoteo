import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { serializePeopleGroup } from '@/lib/jpSerializer';
import { asStr, optStr, asInt, optInt, optFloat, optBigInt, asBool } from '@/lib/adminUtils';

/** PUT /api/admin/people-groups/[id] — actualiza un grupo étnico (solo admin). */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(request);
  if (!('user' in auth)) return auth;

  try {
    const id = params.id;
    const existing = await prisma.peopleGroup.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'El grupo étnico no existe.' }, { status: 404 });
    }

    const body = await request.json();
    const countryCode = asStr(body.countryCode).toUpperCase();
    const peopleName = asStr(body.peopleName);
    const primaryLanguage = asStr(body.primaryLanguage);
    const primaryReligion = asStr(body.primaryReligion);

    if (!countryCode || !peopleName || !primaryLanguage || !primaryReligion) {
      return NextResponse.json(
        { error: 'countryCode, peopleName, primaryLanguage y primaryReligion son obligatorios.' },
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

    const group = await prisma.peopleGroup.update({
      where: { id },
      data: {
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

    return NextResponse.json({ peopleGroup: serializePeopleGroup(group) });
  } catch (error) {
    console.error('[PUT /api/admin/people-groups/:id]', error);
    return NextResponse.json({ error: 'Error interno al actualizar el grupo.' }, { status: 500 });
  }
}

/** DELETE /api/admin/people-groups/[id] — elimina un grupo étnico (solo admin). */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(request);
  if (!('user' in auth)) return auth;

  try {
    const existing = await prisma.peopleGroup.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'El grupo étnico no existe.' }, { status: 404 });
    }
    await prisma.peopleGroup.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[DELETE /api/admin/people-groups/:id]', error);
    return NextResponse.json({ error: 'Error interno al eliminar el grupo.' }, { status: 500 });
  }
}