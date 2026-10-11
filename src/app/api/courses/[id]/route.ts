import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeCourse } from '@/lib/courseSerializer';

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/courses/[id]
 * Devuelve un curso con sus clases ordenadas.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: {
        lessons: { orderBy: { order: 'asc' }, include: { resources: true } },
        createdBy: { select: { name: true, email: true } },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Curso no encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ course: serializeCourse(course) });
  } catch (error) {
    console.error('[GET /api/courses/:id]', error);
    return NextResponse.json({ error: 'Error interno al obtener el curso.' }, { status: 500 });
  }
}

/**
 * PUT /api/courses/[id]
 * Actualiza el curso y REEMPLAZA por completo su lista de clases
 * (transacción: elimina las anteriores y crea las nuevas con su orden).
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const body = await request.json();
    const title = String(body?.title ?? '').trim();
    const type = String(body?.type ?? 'COURSE');
    const description = String(body?.description ?? '').trim();
    const coverImage = body?.coverImage ? String(body.coverImage).trim() : null;
    const lessons = Array.isArray(body?.lessons) ? body.lessons : [];

    if (!title || !description || !['COURSE', 'TALK', 'EVENT'].includes(type)) {
      return NextResponse.json({ error: 'Datos del curso incompletos o inválidos.' }, { status: 400 });
    }

    const existing = await prisma.course.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Curso no encontrado.' }, { status: 404 });
    }

    // Campos de evento/charla (opcionales; solo aplican a TALK/EVENT)
    const VALID_MODALITIES = ['VIRTUAL', 'IN_PERSON', 'HYBRID'];
    const modality = body?.modality ? String(body.modality) : null;
    if (modality && !VALID_MODALITIES.includes(modality)) {
      return NextResponse.json({ error: 'Modalidad inválida.' }, { status: 400 });
    }
    const location = body?.location ? String(body.location).trim() : null;
    const eventDate = body?.eventDate ? new Date(String(body.eventDate)) : null;
    if (eventDate && isNaN(eventDate.getTime())) {
      return NextResponse.json({ error: 'Fecha del evento inválida.' }, { status: 400 });
    }
    const meetingLink = body?.meetingLink ? String(body.meetingLink).trim() : null;
    const recordingLink = body?.recordingLink ? String(body.recordingLink).trim() : null;
    const isEventLike = type !== 'COURSE';

    const pricePEN = body?.pricePEN != null && body.pricePEN !== '' ? Number(body.pricePEN) : null;
    const priceUSD = body?.priceUSD != null && body.priceUSD !== '' ? Number(body.priceUSD) : null;
    if (
      (pricePEN != null && (!Number.isFinite(pricePEN) || pricePEN < 0)) ||
      (priceUSD != null && (!Number.isFinite(priceUSD) || priceUSD < 0))
    ) {
      return NextResponse.json({ error: 'Los precios deben ser números mayores o iguales a cero.' }, { status: 400 });
    }

    const capacity = body?.capacity != null && body.capacity !== '' ? Number(body.capacity) : null;
    if (capacity != null && (!Number.isInteger(capacity) || capacity < 0)) {
      return NextResponse.json({ error: 'La capacidad debe ser un número entero igual o mayor que cero.' }, { status: 400 });
    }

    const validLessons = lessons
      .filter((l: Record<string, unknown>) => l && String(l.title ?? '').trim() && String(l.videoUrl ?? '').trim())
      .map((l: Record<string, unknown>, i: number) => {
        const lessonResources = Array.isArray(l.resources)
          ? (l.resources as Array<Record<string, unknown>>)
              .filter((r) => r && String(r.name ?? '').trim() && String(r.url ?? '').trim())
              .map((r) => ({ name: String(r.name).trim(), url: String(r.url).trim() }))
          : [];
        return {
          title: String(l.title).trim(),
          description: l.description ? String(l.description).trim() : null,
          videoUrl: String(l.videoUrl).trim(),
          resourcesUrl: l.resourcesUrl ? String(l.resourcesUrl).trim() : null,
          durationSeconds:
            Number.isFinite(Number(l.durationSeconds)) && Number(l.durationSeconds) > 0
              ? Math.round(Number(l.durationSeconds))
              : null,
          order: Number.isFinite(Number(l.order)) ? Number(l.order) : i + 1,
          resources: { create: lessonResources },
        };
      });

    const course = await prisma.$transaction(async (tx) => {
      // Reemplazo atómico de la lista de clases (mantiene consistencia padre-hijo).
      await tx.courseLesson.deleteMany({ where: { courseId: params.id } });

      return tx.course.update({
        where: { id: params.id },
        data: {
          title,
          type: type as 'COURSE' | 'TALK' | 'EVENT',
          description,
          coverImage,
          modality: isEventLike ? (modality as 'VIRTUAL' | 'IN_PERSON' | 'HYBRID' | null) : null,
          location: isEventLike ? location : null,
          eventDate: isEventLike ? eventDate : null,
          meetingLink: isEventLike ? meetingLink : null,
          recordingLink: isEventLike ? recordingLink : null,
          pricePEN: isEventLike ? pricePEN : null,
          priceUSD: isEventLike ? priceUSD : null,
          capacity: isEventLike ? capacity : null,
          lessons: { create: validLessons },
        },
        include: {
          lessons: { orderBy: { order: 'asc' }, include: { resources: true } },
          createdBy: { select: { name: true, email: true } },
        },
      });
    });

    return NextResponse.json({ course: serializeCourse(course) });
  } catch (error) {
    console.error('[PUT /api/courses/:id]', error);
    return NextResponse.json({ error: 'Error interno al actualizar el curso.' }, { status: 500 });
  }
}

/**
 * DELETE /api/courses/[id]
 * Elimina el curso; las clases se eliminan en cascada (onDelete: Cascade).
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const existing = await prisma.course.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Curso no encontrado.' }, { status: 404 });
    }

    await prisma.course.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[DELETE /api/courses/:id]', error);
    return NextResponse.json({ error: 'Error interno al eliminar el curso.' }, { status: 500 });
  }
}