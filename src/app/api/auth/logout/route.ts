import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/session';

/**
 * POST /api/auth/logout
 * Invalida la cookie httpOnly de sesión (la borra).
 * El logout del store sigue limpiando el estado del navegador; esto solo
 * elimina la cookie del server para que /api/admin/* deje de reconocerla.
 */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  return clearSessionCookie(response);
}