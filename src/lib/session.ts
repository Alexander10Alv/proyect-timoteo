import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

/**
 * Sesión para los endpoints de administración de Joshua Project.
 *
 * Al hacer login se firma un JWT (HS256) con el secreto AUTH_SECRET y se
 * entrega al navegador en una cookie httpOnly (no legible por JS, no falsificable).
 * Cada endpoint /api/admin/* valida esa cookie en el servidor (firma + vigencia)
 * y exige que el usuario exista en MySQL con rol ADMIN.
 *
 * El resto del sistema de auth (store Zustand / login / registro) NO se toca.
 */

export const SESSION_COOKIE = 'hc_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 días

const SESSION_PAYLOAD = { userId: '', role: '' } as const;

type SessionPayload = { userId: string; role: string };

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('AUTH_SECRET no configurado en .env (mínimo 16 caracteres). Configúralo y reinicia el servidor.');
  }
  return secret;
}

export function signSessionToken(user: SessionPayload): string {
  return jwt.sign({ userId: user.userId, role: user.role }, getSecret(), {
    expiresIn: '7d',
  });
}

export function setSessionCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return response;
}

/** Lee una cookie del header Cookie sin depender de la clase NextRequest
 *  (en dev/webpack el handler no es instancia de esa clase y `instanceof` falla). */
function readCookie(name: string, header: string): string | null {
  const prefix = `${name}=`;
  for (const part of header.split(';')) {
    const trimmed = part.trim();
    if (!trimmed.startsWith(prefix)) continue;
    const raw = trimmed.slice(prefix.length);
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return null;
}

async function verifySession(request: NextRequest | Request): Promise<SessionPayload | null> {
  const value = readCookie(SESSION_COOKIE, request.headers.get('cookie') ?? '');
  if (!value) return null;
  try {
    const payload = jwt.verify(value, getSecret()) as SessionPayload;
    if (!payload.userId || !payload.role) return null;
    return payload;
  } catch {
    return null;
  }
}

export type AdminAuthResult =
  | { user: { id: string; role: string } }
  | NextResponse;

/**
 * Guard de endpoints /api/admin/*.
 * - 401 si no hay cookie de sesión válida (firma/vencimiento).
 * - 403 si el usuario autenticado no es ADMIN (según MySQL).
 * - Devuelve { user } en éxito.
 */
export async function requireAdmin(request: NextRequest | Request): Promise<AdminAuthResult> {
  const session = await verifySession(request);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado. Sesión inválida o expirada.' }, { status: 401 });
  }
  const dbUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true },
  });
  if (!dbUser || dbUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acceso restringido a administradores.' }, { status: 403 });
  }
  return { user: dbUser };
}

export type UserAuthResult =
  | { user: { id: string; role: string; name: string; email: string } }
  | NextResponse;

/**
 * Guard de endpoints que requieren cualquier usuario autenticado (VISITOR o ADMIN).
 * Usa la misma cookie httpOnly (hc_session) que requireAdmin.
 */
export async function requireUser(request: NextRequest | Request): Promise<UserAuthResult> {
  const session = await verifySession(request);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado. Sesión inválida o expirada.' }, { status: 401 });
  }
  const dbUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true, name: true, email: true },
  });
  if (!dbUser) {
    return NextResponse.json({ error: 'No autorizado. Sesión inválida o expirada.' }, { status: 401 });
  }
  return { user: dbUser };
}