import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

interface RouteParams {
  params: { id: string };
}

/**
 * POST /api/courses/[id]/purchases/manual
 * Registra un pago en efectivo (manual) realizado fuera de la pasarela
 * — útil para eventos presenciales donde se cobra en la puerta.
 * Solo admin.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin(request);
  if (!('user' in auth)) return auth;

  try {
    const course = await prisma.course.findUnique({ where: { id: params.id } });
    if (!course) {
      return NextResponse.json({ error: 'Evento no encontrado.' }, { status: 404 });
    }
    if (course.type === 'COURSE') {
      return NextResponse.json({ error: 'Los cursos libres no tienen pagos manuales.' }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const name = String(body?.name ?? '').trim();
    const email = String(body?.email ?? '').trim().toLowerCase();
    const amount = Number(body?.amount);
    const currency = String(body?.currency ?? 'PEN').toUpperCase();

    if (!name) {
      return NextResponse.json({ error: 'El nombre es requerido.' }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'El monto debe ser mayor a cero.' }, { status: 400 });
    }
    if (currency !== 'PEN' && currency !== 'USD') {
      return NextResponse.json({ error: 'Moneda inválida.' }, { status: 400 });
    }

    const purchase = await prisma.coursePurchase.create({
      data: {
        courseId: params.id,
        userId: null,
        name,
        email: email || '—',
        amount,
        currency,
        method: 'MANUAL',
        status: 'COMPLETED',
        transactionId: null,
      },
    });

    return NextResponse.json(
      {
        purchase: {
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
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/courses/:id/purchases/manual]', error);
    return NextResponse.json({ error: 'Error interno al registrar el pago manual.' }, { status: 500 });
  }
}