/**
 * Utilidades de parsing/validación para los endpoints de administración
 * de Joshua Project. Los formularios envían strings/números/checkbox, aquí se
 * normalizan a los tipos de Prisma (incl. BigInt) de forma defensiva.
 */

export function asStr(value: unknown): string {
  return value == null ? '' : String(value).trim();
}

export function optStr(value: unknown): string | null {
  if (value == null || String(value).trim() === '') return null;
  return String(value).trim();
}

export function asInt(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

export function optInt(value: unknown): number | null {
  if (value == null || String(value).trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

export function optFloat(value: unknown): number | null {
  if (value == null || String(value).trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** BigInt obligatorio (campos población de Country). 0 si inválido. */
export function asBigInt(value: unknown): bigint {
  const n = Number(value);
  return BigInt(Number.isFinite(n) && n >= 0 ? Math.trunc(n) : 0);
}

/** BigInt opcional (poblaciones globales / provincias). null si vacío/inválido. */
export function optBigInt(value: unknown): bigint | null {
  if (value == null || String(value).trim() === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return BigInt(Math.trunc(n));
}

export function asBool(value: unknown): boolean {
  return value === true || value === 'true' || value === 'on' || value === '1';
}