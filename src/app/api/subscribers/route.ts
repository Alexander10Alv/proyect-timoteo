import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';

/**
 * Sincroniza la suscripción con Brevo (Contactos) de forma NO bloqueante:
 * si BREVO_API_KEY no está configurada, se omite (funcionamiento local).
 * Nunca impide que la suscripción local se guarde.
 */
async function syncWithBrevo(email: string): Promise<{ synced: boolean; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return { synced: false };

  const listId = process.env.BREVO_LIST_ID ? Number(process.env.BREVO_LIST_ID) : undefined;
  const payload: Record<string, unknown> = {
    email,
    updateEnabled: true,
  };
  if (listId && Number.isFinite(listId)) {
    payload.listIds = [listId];
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok && res.status !== 400) {
      // 400 suele significar contacto ya moderado/existente; no es bloqueante.
      return { synced: false, error: `Brevo HTTP ${res.status}` };
    }
    return { synced: true };
  } catch (error) {
    console.warn('[Brevo] no se pudo sincronizar', error);
    return { synced: false, error: 'Error de red con Brevo' };
  }
}

/**
 * GET /api/subscribers
 * Lista todos los suscriptores.
 */
export async function GET() {
  try {
    const subscribers = await prisma.subscriber.findMany({ orderBy: { subscribedAt: 'desc' } });
    return NextResponse.json({ subscribers });
  } catch (error) {
    console.error('[GET /api/subscribers]', error);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}

/**
 * POST /api/subscribers
 * Crea una suscripción al boletín. Requiere sesión iniciada: el suscriptor
 * se registra con los DATOS del perfil del usuario (nombre, apellido,
 * correo, celular, iglesia y país), que son obligatorios al registrarse.
 */
export async function POST(request: Request) {
  try {
    const auth = await requireUser(request);
    if (auth instanceof NextResponse) return auth;

    const profile = await prisma.user.findUnique({
      where: { id: auth.user.id },
      include: { subscription: true },
    });
    if (!profile) {
      return NextResponse.json({ error: 'Cuenta no encontrada.' }, { status: 401 });
    }

    const email = profile.email.toLowerCase();
    const phone = profile.subscription?.phone ?? null;
    const firstName = profile.name.trim() || null;
    const lastName = profile.lastName?.trim() || null;
    const church = profile.church?.trim() || null;
    const country = profile.country ?? null;

    const existingByUser = await prisma.subscriber.findUnique({ where: { userId: profile.id } });
    if (existingByUser && existingByUser.status === 'ACTIVE') {
      return NextResponse.json({ error: 'Ya estás suscrito al boletín.' }, { status: 409 });
    }
    if (existingByUser && existingByUser.status !== 'ACTIVE') {
      const subscriber = await prisma.subscriber.update({
        where: { userId: profile.id },
        data: {
          status: 'ACTIVE',
          unsubscribedAt: null,
          firstName,
          lastName,
          email,
          phone,
          church,
          country,
        },
      });
      const brevo = await syncWithBrevo(email);
      return NextResponse.json({ subscriber, reactivated: true, brevo }, { status: 201 });
    }

    const existingByEmail = await prisma.subscriber.findUnique({ where: { email } });
    if (existingByEmail && existingByEmail.status === 'ACTIVE') {
      return NextResponse.json({ error: 'Este correo ya está suscrito al boletín.' }, { status: 409 });
    }

    const subscriber = await prisma.subscriber.create({
      data: {
        userId: profile.id,
        firstName,
        lastName,
        email,
        phone,
        church,
        country,
      },
    });
    const brevo = await syncWithBrevo(email);
    return NextResponse.json({ subscriber, brevo }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/subscribers]', error);
    return NextResponse.json({ error: 'Error interno al suscribir.' }, { status: 500 });
  }
}