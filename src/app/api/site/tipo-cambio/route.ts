import { NextResponse } from 'next/server';

/**
 * GET /api/site/tipo-cambio
 * Devuelve el tipo de cambio USD → S/ (PEN) consultando la API oficial de SUNAT.
 *
 * Cadena de fallback (misma lógica que ArequiPago):
 *   1. SUNAT (api.apis.net.pe) con token Bearer y header Referer.
 *   2. API gratuita de respaldo (exchangerate-api).
 *   3. Valor por defecto 3.70.
 *
 * El token se lee de la variable de entorno SUNAT_API_TOKEN; si no está
 * definida, la petición a SUNAT se salta y se usa el respaldo.
 */

const DEFAULT_RATE = 3.7;
const SUNAT_TOKEN = process.env.SUNAT_API_TOKEN;
const SUNAT_TIMEOUT_MS = 10_000;
const SUNAT_URL = 'https://api.apis.net.pe/v2/sunat/tipo-cambio';
const FALLBACK_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

function roundPenny(value: number): number {
  return Number(value.toFixed(2));
}

export async function GET() {
  let tipoCambio: number | null = null;
  let fuente: 'sunat' | 'respaldo' | 'default' = 'default';
  let cotizacionCompra: number | null = null;
  let cotizacionVenta: number | null = null;

  // Nivel 1: SUNAT
  if (SUNAT_TOKEN) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), SUNAT_TIMEOUT_MS);
      const response = await fetch(SUNAT_URL, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${SUNAT_TOKEN}`,
          Referer: 'https://apis.net.pe/tipo-de-cambio-sunat-api',
        },
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (response.ok) {
        const data = (await response.json()) as {
          precioCompra?: string | number;
          precioVenta?: string | number;
        };
        cotizacionCompra = data.precioCompra != null ? Number(data.precioCompra) : null;
        cotizacionVenta = data.precioVenta != null ? Number(data.precioVenta) : null;
        const venta = cotizacionVenta ?? cotizacionCompra;
        if (venta && Number.isFinite(venta) && venta > 0) {
          tipoCambio = roundPenny(venta);
          fuente = 'sunat';
        }
      }
    } catch {
      // Fallo de red / timeout → se continúa con el respaldo.
    }
  }

  // Nivel 2: respaldo gratuito
  if (tipoCambio == null) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), SUNAT_TIMEOUT_MS);
      const response = await fetch(FALLBACK_URL, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (response.ok) {
        const data = (await response.json()) as { rates?: Record<string, number> };
        const pen = data.rates?.['PEN'];
        if (pen && Number.isFinite(pen) && pen > 0) {
          tipoCambio = roundPenny(pen);
          fuente = 'respaldo';
        }
      }
    } catch {
      // Fallo → valor por defecto.
    }
  }

  // Nivel 3: valor por defecto
  if (tipoCambio == null) {
    tipoCambio = DEFAULT_RATE;
    fuente = 'default';
  }

return NextResponse.json({
    tipo_cambio: tipoCambio,
    fuente,
    fecha: new Date().toISOString(),
    compra: cotizacionCompra != null ? roundPenny(cotizacionCompra) : null,
    venta: cotizacionVenta != null ? roundPenny(cotizacionVenta) : null,
  });
}