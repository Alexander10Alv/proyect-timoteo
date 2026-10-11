import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signSessionToken, setSessionCookie } from '@/lib/session';

/**
 * POST /api/auth/login
 * Valida credenciales contra MySQL (bcrypt) y devuelve el perfil sin el hash.
 * Adicionalmente firma y entrega una cookie httpOnly de sesión (AUTH_SECRET)
 * usada únicamente por los endpoints de administración /api/admin/*.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? '').trim().toLowerCase();
    const password = String(body?.password ?? '');

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son requeridos.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { subscription: true },
    });

    // Mensaje genérico para no filtrar qué correos existen.
    if (!user) {
      return NextResponse.json({ error: 'Credenciales inválidas.' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Credenciales inválidas.' }, { status: 401 });
    }

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        country: user.country,
        phone: user.subscription?.phone ?? undefined,
        createdAt: user.createdAt,
      },
    });

    // Cookie httpOnly de sesión para el CRUD admin (JWT firmado).
    // Si AUTH_SECRET aún no está configurado, el login sigue funcionando
    // pero los endpoints /api/admin/* responderán 401 (fail-closed).
    try {
      const token = signSessionToken({ userId: user.id, role: user.role });
      return setSessionCookie(response, token);
    } catch (error) {
      console.error('[POST /api/auth/login] AUTH_SECRET no disponible, sin cookie de sesión:', error);
      return response;
    }
  } catch (error) {
    console.error('[POST /api/auth/login]', error);
    return NextResponse.json({ error: 'Error interno al iniciar sesión.' }, { status: 500 });
  }
}