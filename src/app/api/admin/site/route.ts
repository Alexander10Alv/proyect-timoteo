import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { normalizeSections, normalizeTheme, normalizeFooter } from '@/lib/siteConfig';

/** GET /api/admin/site — lee la config guardada (solo admin). */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!('user' in auth)) return auth;

  const row = await prisma.siteConfig.findFirst();
  if (!row) {
    return NextResponse.json({ siteName: 'Proyecto Timoteo', homeConfig: {}, themeConfig: {}, footerConfig: {} });
  }

  return NextResponse.json({
    siteName: row.siteName,
    homeConfig: row.homeConfig,
    themeConfig: row.themeConfig,
    footerConfig: row.footerConfig,
  });
}

/**
 * PUT /api/admin/site — guarda la config (solo admin).
 * Cuerpo: { siteName?, home?, theme?, footer? } (JSON por bloque).
 * Acepta también { homeConfig, themeConfig, footerConfig }.
 */
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!('user' in auth)) return auth;

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 });
    }

    const siteName =
      typeof body.siteName === 'string' && body.siteName.trim()
        ? body.siteName.trim()
        : 'Proyecto Timoteo';

    const home = body.home ?? body.homeConfig ?? {};
    const theme = body.theme ?? body.themeConfig ?? {};
    const footer = body.footer ?? body.footerConfig ?? {};

    // Validación ligera: solo objetos JSON serializables.
    const homeNormalized = normalizeSections(home);
    const themeNormalized = normalizeTheme(theme);
    const footerNormalized = normalizeFooter(footer);

    await prisma.siteConfig.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        siteName,
        homeConfig: homeNormalized,
        themeConfig: themeNormalized,
        footerConfig: footerNormalized,
      },
      update: {
        siteName,
        homeConfig: homeNormalized,
        themeConfig: themeNormalized,
        footerConfig: footerNormalized,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[PUT /api/admin/site]', error);
    return NextResponse.json({ error: 'Error al guardar la configuración.' }, { status: 500 });
  }
}
