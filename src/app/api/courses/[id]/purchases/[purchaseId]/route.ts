import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

interface RouteParams {
  params: { id: string; purchaseId: string };
}

/**
 * PATCH /api/courses/[id]/purchases/[purchaseId]
 * Marca asistencia (asistió ✓) o cambia el estado de un pago. Solo admin.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin(request);
  if (!('user' in auth)) return auth;

  try {
    const body = await request.json().catch(() => null);
    const existing = await prisma.coursePurchase.findFirst({
      where: { id: params.purchaseId, courseId: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Registro de pago no encontrado.' }, { status: 404 });
    }

    const data: { attended?: boolean; status?: 'COMPLETED' | 'REFUNDED' | 'FAILED' } = {};
    if (typeof body?.attended === 'boolean') data.attended = body.attended;
    if (body?.status !== undefined) {
      if (!['COMPLETED', 'REFUNDED', 'FAILED'].includes(String(body.status))) {
        return NextResponse.json({ error: 'Estado inválido.' }, { status: 400 });
      }
      data.status = String(body.status) as 'COMPLETED' | 'REFUNDED' | 'FAILED';
    }

    const purchase = await prisma.coursePurchase.update({
      where: { id: params.purchaseId },
      data,
    });

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('[PATCH /api/courses/:id/purchases/:purchaseId]', error);
    return NextResponse.json({ error: 'Error interno al actualizar el registro.' }, { status: 500 });
  }
}