import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeSections, normalizeTheme, normalizeFooter } from '@/lib/siteConfig';

export const dynamic = 'force-dynamic';

/**
 * GET /api/site (público)
 * Devuelve la configuración del sitio (nombre, home, tema, footer).
 * Si no hay fila guardada, devuelve los defaults (nombre "Proyecto Timoteo").
 */
export async function GET() {
  try {
    const row = await prisma.siteConfig.findFirst();

    return NextResponse.json({
      siteName: row?.siteName ?? 'Proyecto Timoteo',
      theme: normalizeTheme(row?.themeConfig ?? undefined),
      sections: normalizeSections(row?.homeConfig ?? undefined),
      footer: normalizeFooter(row?.footerConfig ?? undefined),
    });
  } catch (error) {
    console.error('[GET /api/site]', error);
    return NextResponse.json({ error: 'Error al leer la configuración.' }, { status: 500 });
  }
}
