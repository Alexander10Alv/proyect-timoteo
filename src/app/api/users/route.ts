import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/users
 * Lista todos los usuarios con su suscripción (para el Centro de Usuarios del admin).
 * Excluye siempre el hash de contraseña.
 */
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: { subscription: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        lastName: u.lastName,
        email: u.email,
        role: u.role,
        country: u.country,
        church: u.church,
        createdAt: u.createdAt,
        subscription: u.subscription
          ? {
              id: u.subscription.id,
              email: u.subscription.email,
              phone: u.subscription.phone,
              receiveWhatsApp: u.subscription.receiveWhatsApp,
              receiveEmail: u.subscription.receiveEmail,
              enrolledCourses: safeParseCourses(u.subscription.enrolledCourses),
              status: u.subscription.status,
              updatedAt: u.subscription.updatedAt,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error('[GET /api/users]', error);
    return NextResponse.json({ error: 'Error interno al listar usuarios.' }, { status: 500 });
  }
}

function safeParseCourses(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}