import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { asStr, asInt } from '@/lib/adminUtils';

const BIBLE_STATUSES = ['FULL_BIBLE', 'NEW_TESTAMENT', 'PORTIONS', 'NONE', 'UNSPECIFIED'];

/**
 * PUT /api/admin/languages/[code] — actualiza un idioma (solo admin).
 * El código es la clave inmutable; se editan el resto de campos.
 */
export async function PUT(request: NextRequest, { params }: { params: { code: string } }) {
  const auth = await requireAdmin(request);
  if (!('user' in auth)) return auth;

  try {
    const languageCode = params.code.toLowerCase();
    const existing = await prisma.language.findUnique({ where: { languageCode } });
    if (!existing) {
      return NextResponse.json({ error: `El idioma ${languageCode} no existe.` }, { status: 404 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Cuerpo JSON inválido.' }, { status: 400 });
    }
    const languageName = asStr(body.languageName).trim();
    const bibleStatus = asStr(body.bibleStatus);
    const primaryGroupsCount = asInt(body.primaryGroupsCount);
    const unreachedGroupsCount = asInt(body.unreachedGroupsCount);

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

    const language = await prisma.language.update({
      where: { languageCode },
      data: { languageName, primaryGroupsCount, unreachedGroupsCount, bibleStatus: bibleStatus as never },
    });

    return NextResponse.json({ language });
  } catch (error) {
    console.error('[PUT /api/admin/languages/:code]', error);
    return NextResponse.json({ error: 'Error interno al actualizar el idioma.' }, { status: 500 });
  }
}

/** DELETE /api/admin/languages/[code] — elimina un idioma (solo admin). */
export async function DELETE(request: NextRequest, { params }: { params: { code: string } }) {
  const auth = await requireAdmin(request);
  if (!('user' in auth)) return auth;

  try {
    const languageCode = params.code.toLowerCase();
    const existing = await prisma.language.findUnique({ where: { languageCode } });
    if (!existing) {
      return NextResponse.json({ error: `El idioma ${languageCode} no existe.` }, { status: 404 });
    }

    await prisma.language.delete({ where: { languageCode } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[DELETE /api/admin/languages/:code]', error);
    return NextResponse.json({ error: 'Error interno al eliminar el idioma.' }, { status: 500 });
  }
}