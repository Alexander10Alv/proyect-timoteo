import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/courses/[id]/my-purchase
 * Devuelve la inscripción/pago del usuario autenticado en este evento,
 * o null si no la tiene. Usado para desbloquear links pagados.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireUser(request);
  if (!('user' in auth)) {
    return NextResponse.json({ purchase: null });
  }
  const { user } = auth;

  try {
    const purchase = await prisma.coursePurchase.findFirst({
      where: { courseId: params.id, email: user.email, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({
      purchase: purchase
        ? {
            id: purchase.id,
            courseId: purchase.courseId,
            userId: purchase.userId,
            name: purchase.name,
            email: purchase.email,
            amount: purchase.amount,
            currency: purchase.currency,
            method: purchase.method,
            transactionId: purchase.transactionId,
            status: purchase.status,
            attended: purchase.attended,
            createdAt: purchase.createdAt,
            updatedAt: purchase.updatedAt,
          }
        : null,
    });
  } catch (error) {
    console.error('[GET /api/courses/:id/my-purchase]', error);
    return NextResponse.json({ error: 'Error interno al consultar tu inscripción.' }, { status: 500 });
  }
}