import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: { id: string };
}

/**
 * DELETE /api/subscribers/[id]
 * Da de baja una suscripción.
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const subscriber = await prisma.subscriber.findUnique({ where: { id: params.id } });
    if (!subscriber) {
      return NextResponse.json({ error: 'Suscripción no encontrada.' }, { status: 404 });
    }

    await prisma.subscriber.update({
      where: { id: params.id },
      data: { status: 'UNSUBSCRIBED', unsubscribedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[DELETE /api/subscribers/:id]', error);
    return NextResponse.json({ error: 'Error interno al dar de baja.' }, { status: 500 });
  }
}