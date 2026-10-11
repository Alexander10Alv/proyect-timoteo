import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { PHONE_COUNTRIES } from '@/lib/phoneCountries';
import { signSessionToken, setSessionCookie } from '@/lib/session';

/**
 * POST /api/auth/register
 * Crea un usuario real en MySQL (tabla users) + su suscripción inicial.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body?.name ?? '').trim();
    const lastName = String(body?.lastName ?? '').trim();
    const email = String(body?.email ?? '').trim().toLowerCase();
    const password = String(body?.password ?? '');
    const countryCode = body?.countryCode ? String(body.countryCode).trim() : null;
    const phoneNumber = String(body?.phone ?? '').trim();
    const church = body?.church ? String(body.church).trim() : null;

    // ── Validaciones ──
    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'El nombre es requerido (mínimo 2 caracteres).' }, { status: 400 });
    }
    if (!lastName || lastName.length < 2) {
      return NextResponse.json({ error: 'El apellido es requerido (mínimo 2 caracteres).' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Correo electrónico inválido.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres.' }, { status: 400 });
    }
    if (!countryCode) {
      return NextResponse.json({ error: 'Selecciona tu país para indicar el código del celular.' }, { status: 400 });
    }
    if (!/^[0-9 ]{6,15}$/.test(phoneNumber)) {
      return NextResponse.json({ error: 'El número de celular debe contener solo dígitos (entre 6 y 15).' }, { status: 400 });
    }

    const phoneCountry = PHONE_COUNTRIES.find((c) => c.code === countryCode);
    if (!phoneCountry) {
      return NextResponse.json({ error: 'El código de país seleccionado no es válido.' }, { status: 400 });
    }
    const phone = `${phoneCountry.dial} ${phoneNumber}`;

    // ── Unicidad de email ──
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta registrada con este correo.' },
        { status: 409 }
      );
    }

    // ── Persistencia en MySQL vía Prisma ──
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        lastName,
        email,
        passwordHash,
        role: 'VISITOR',
        country: countryCode,
        church: church || null,
        subscription: {
          create: {
            email,
            phone,
            receiveWhatsApp: true,
            receiveEmail: true,
            enrolledCourses: '[]',
            status: 'ACTIVE',
          },
        },
      },
      include: { subscription: true },
    });

    // Respuesta sin datos sensibles
    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          country: user.country,
          church: user.church,
          phone: user.subscription?.phone ?? undefined,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    );

    // El registro inicia sesión: firma la cookie httpOnly (hc_session) que usan
    // requireAdmin/requireUser. Si AUTH_SECRET no está disponible, el registro
    // funciona igual pero el usuario deberá iniciar sesión luego.
    try {
      const token = signSessionToken({ userId: user.id, role: user.role });
      return setSessionCookie(response, token);
    } catch (error) {
      console.error('[POST /api/auth/register] AUTH_SECRET no disponible, sin cookie de sesión:', error);
      return response;
    }
  } catch (error) {
    console.error('[POST /api/auth/register]', error);
    return NextResponse.json({ error: 'Error interno al registrar el usuario.' }, { status: 500 });
  }
}