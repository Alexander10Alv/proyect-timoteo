import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireUser } from '@/lib/session';
import { processPayment } from '@/services/paymentService';

interface RouteParams {
  params: { id: string };
}

function serializePurchase(p: {
  id: string;
  courseId: string;
  userId: string | null;
  name: string;
  email: string;
  amount: number;
  currency: string;
  method: string;
  transactionId: string | null;
  status: string;
  attended: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: p.id,
    courseId: p.courseId,
    userId: p.userId,
    name: p.name,
    email: p.email,
    amount: p.amount,
    currency: p.currency,
    method: p.method,
    transactionId: p.transactionId,
    status: p.status,
    attended: p.attended,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

/**
 * GET /api/courses/[id]/purchases — lista de pagos/inscripciones (solo admin).
 * Esta es la "lista de la puerta" para presencial y el historial de pagos.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin(request);
  if (!('user' in auth)) return auth;

  try {
    const purchases = await prisma.coursePurchase.findMany({
      where: { courseId: params.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ purchases: purchases.map(serializePurchase) });
  } catch (error) {
    console.error('[GET /api/courses/:id/purchases]', error);
    return NextResponse.json({ error: 'Error interno al listar los pagos.' }, { status: 500 });
  }
}

/**
 * POST /api/courses/[id]/purchases — inscribirse/pagar a una Charla o Evento
 * (usuario autenticado). Ejecuta la pasarela (mock por ahora) del lado servidor
 * y registra la compra + la matrícula en el perfil del usuario.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await requireUser(request);
  if (!('user' in auth)) return auth;
  const { user } = auth;

  try {
    const course = await prisma.course.findUnique({ where: { id: params.id } });
    if (!course) {
      return NextResponse.json({ error: 'Evento no encontrado.' }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    // Los cursos libres también se inscriben (gratis) para llevar el registro en "Mis inscripciones".
    const isFree = course.type === 'COURSE' || (course.pricePEN == null && course.priceUSD == null);

    // Idempotencia: si ya está inscrito/pagó, no se cobra dos veces.
    const already = await prisma.coursePurchase.findFirst({
      where: { courseId: params.id, email: user.email, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
    });
    if (already) {
      const enrolledCourses = await enroll(params.id, user.id);
      return NextResponse.json({ purchase: serializePurchase(already), enrolledCourses });
    }

    // Cupo (capacidad máxima opcional).
    if (course.capacity != null) {
      const filled = await prisma.coursePurchase.count({
        where: { courseId: params.id, status: 'COMPLETED' },
      });
      if (filled >= course.capacity) {
        return NextResponse.json(
          { error: `Cupo completo de ${course.capacity} inscritos para este evento.` },
          { status: 400 }
        );
      }
    }

    let purchase;
    if (isFree) {
      purchase = await prisma.coursePurchase.create({
        data: {
          courseId: params.id,
          userId: user.id,
          name: user.name,
          email: user.email,
          amount: 0,
          currency: 'PEN',
          method: 'FREE',
          status: 'COMPLETED',
        },
      });
    } else {
      const currency = String(body?.currency ?? '').toUpperCase();
      if (currency !== 'PEN' && currency !== 'USD') {
        return NextResponse.json({ error: 'Elige moneda: Soles (PEN) o Dólares (USD).' }, { status: 400 });
      }
      const amount = currency === 'PEN' ? course.pricePEN : course.priceUSD;
      if (amount == null || amount <= 0) {
        return NextResponse.json({ error: 'Este evento no tiene precio en la moneda elegida.' }, { status: 400 });
      }
      const method = String(body?.method ?? 'CARD').toUpperCase();
      if (method !== 'CARD' && method !== 'PAYPAL') {
        return NextResponse.json({ error: 'Método de pago inválido.' }, { status: 400 });
      }
      const card =
        body?.card && typeof body.card === 'object'
          ? { number: String(body.card.number ?? ''), holder: String(user.name), expiry: String(body.card.expiry ?? ''), cvc: String(body.card.cvc ?? '') }
          : undefined;

      const payment = await processPayment({ amount, currency, method, donorName: user.name, donorEmail: user.email, card });
      if (payment.status !== 'COMPLETED') {
        return NextResponse.json(
          { error: payment.error ?? 'El pago no fue aprobado por la pasarela.' },
          { status: 400 }
        );
      }

      purchase = await prisma.coursePurchase.create({
        data: {
          courseId: params.id,
          userId: user.id,
          name: user.name,
          email: user.email,
          amount,
          currency,
          method,
          transactionId: payment.transactionId || payment.providerReference,
          status: 'COMPLETED',
        },
      });
    }

    const enrolledCourses = await enroll(params.id, user.id);
    return NextResponse.json(
      { purchase: serializePurchase(purchase), enrolledCourses },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/courses/:id/purchases]', error);
    return NextResponse.json({ error: 'Error interno al procesar la inscripción.' }, { status: 500 });
  }
}

/** Añade el curso a enrolledCourses del usuario (si aún no está). */
async function enroll(courseId: string, userId: string): Promise<string[]> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) return [courseId];
  let list: string[] = [];
  try {
    const parsed = JSON.parse(sub.enrolledCourses);
    if (Array.isArray(parsed)) list = parsed.map(String);
  } catch {
    list = [];
  }
  if (!list.includes(courseId)) {
    list = [...list, courseId];
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { enrolledCourses: JSON.stringify(list) },
    });
  }
  return list;
}