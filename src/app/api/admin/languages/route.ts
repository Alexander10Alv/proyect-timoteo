import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { asStr, asInt } from '@/lib/adminUtils';

/** GET /api/admin/languages — lista todos los idiomas (solo admin). */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!('user' in auth)) return auth;

  try {
    const languages = await prisma.language.findMany({ orderBy: { languageName: 'asc' } });
    return NextResponse.json({ languages });
  } catch (error) {
    console.error('[GET /api/admin/languages]', error);
    return NextResponse.json({ error: 'Error interno al listar los idiomas.' }, { status: 500 });
  }
}

const BIBLE_STATUSES = ['FULL_BIBLE', 'NEW_TESTAMENT', 'PORTIONS', 'NONE', 'UNSPECIFIED'];

/** POST /api/admin/languages — crea un idioma (solo admin). */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!('user' in auth)) return auth;

  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Cuerpo JSON inválido.' }, { status: 400 });
    }
    const languageCode = asStr(body.languageCode).trim().toLowerCase();
    const languageName = asStr(body.languageName).trim();
    const bibleStatus = asStr(body.bibleStatus);
    const primaryGroupsCount = asInt(body.primaryGroupsCount);
    const unreachedGroupsCount = asInt(body.unreachedGroupsCount);

    if (!/^[a-z]{2,5}$/.test(languageCode)) {
      return NextResponse.json({ error: 'Código de idioma inválido (ISO 639-3, ej. "acu").' }, { status: 400 });
    }
    if (languageName.length < 2) {
      return NextResponse.json({ error: 'El nombre del idioma debe tener al menos 2 caracteres.' }, { status: 400 });
    }
    if (!BIBLE_STATUSES.includes(bibleStatus)) {
      return NextResponse.json(
        { error: 'Estado de la Biblia inválido. Usa FULL_BIBLE, NEW_TESTAMENT, PORTIONS, NONE o UNSPECIFIED.' },
        { status: 400 }
      );
    }
    if (primaryGroupsCount < 0 || unreachedGroupsCount < 0) {
      return NextResponse.json({ error: 'Los conteos no pueden ser negativos.' }, { status: 400 });
    }

    const language = await prisma.language.create({
      data: { languageCode, languageName, primaryGroupsCount, unreachedGroupsCount, bibleStatus: bibleStatus as never },
    });

    return NextResponse.json({ language }, { status: 201 });
  } catch (error) {
    const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as { code: unknown }).code) : '';
    if (code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe un idioma con ese código.' }, { status: 409 });
    }
    console.error('[POST /api/admin/languages]', error);
    return NextResponse.json({ error: 'Error interno al crear el idioma.' }, { status: 500 });
  }
}