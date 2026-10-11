import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeCourse } from '@/lib/courseSerializer';

/**
 * GET /api/courses
 * Lista todos los cursos con sus clases ordenadas.
 */
export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      include: {
        lessons: { orderBy: { order: 'asc' }, include: { resources: true } },
        createdBy: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ courses: courses.map(serializeCourse) });
  } catch (error) {
    console.error('[GET /api/courses]', error);
    return NextResponse.json({ error: 'Error interno al listar los cursos.' }, { status: 500 });
  }
}

/**
 * POST /api/courses
 * Crea un curso junto con sus clases iniciales (relación padre-hijo).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = String(body?.title ?? '').trim();
    const type = String(body?.type ?? 'COURSE');
    const description = String(body?.description ?? '').trim();
    const coverImage = body?.coverImage ? String(body.coverImage).trim() : null;
    const authorEmail = String(body?.authorEmail ?? '').trim().toLowerCase();
    const lessons = Array.isArray(body?.lessons) ? body.lessons : [];

    if (!title || title.length < 3) {
      return NextResponse.json({ error: 'El título es requerido (mínimo 3 caracteres).' }, { status: 400 });
    }
    if (!['COURSE', 'TALK', 'EVENT'].includes(type)) {
      return NextResponse.json({ error: 'Tipo de publicación inválido.' }, { status: 400 });
    }
    if (!description) {
      return NextResponse.json({ error: 'La descripción es requerida.' }, { status: 400 });
    }

    const author = await prisma.user.findUnique({ where: { email: authorEmail } });
    if (!author) {
      return NextResponse.json(
        { error: 'El autor indicado no existe en la base de datos.' },
        { status: 400 }
      );
    }

    // Campos de evento/charla (opcionales)
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

    // Precios (Soles/Dólares). Solo aplican a Charla/Evento; Curso queda gratis.
    const pricePEN = body?.pricePEN != null && body.pricePEN !== '' ? Number(body.pricePEN) : null;
    const priceUSD = body?.priceUSD != null && body.priceUSD !== '' ? Number(body.priceUSD) : null;
    if (
      (pricePEN != null && (!Number.isFinite(pricePEN) || pricePEN < 0)) ||
      (priceUSD != null && (!Number.isFinite(priceUSD) || priceUSD < 0))
    ) {
      return NextResponse.json({ error: 'Los precios deben ser números mayores o iguales a cero.' }, { status: 400 });
    }

    // Cupo máximo (opcional, solo Charla/Evento)
    const capacity = body?.capacity != null && body.capacity !== '' ? Number(body.capacity) : null;
    if (capacity != null && (!Number.isInteger(capacity) || capacity < 0)) {
      return NextResponse.json({ error: 'La capacidad debe ser un número entero igual o mayor que cero.' }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: {
        title,
        type: type as 'COURSE' | 'TALK' | 'EVENT',
        description,
        coverImage,
        createdById: author.id,
        modality: type === 'COURSE' ? null : (modality as 'VIRTUAL' | 'IN_PERSON' | 'HYBRID' | null),
        location: type === 'COURSE' ? null : location,
        eventDate: type === 'COURSE' ? null : eventDate,
        meetingLink: type === 'COURSE' ? null : meetingLink,
        recordingLink: type === 'COURSE' ? null : recordingLink,
        pricePEN: type === 'COURSE' ? null : pricePEN,
        priceUSD: type === 'COURSE' ? null : priceUSD,
        capacity: type === 'COURSE' ? null : capacity,
        lessons: {
          create: lessons
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
                durationSeconds: Number.isFinite(Number(l.durationSeconds)) && Number(l.durationSeconds) > 0
                  ? Math.round(Number(l.durationSeconds))
                  : null,
                order: Number.isFinite(Number(l.order)) ? Number(l.order) : i + 1,
                resources: { create: lessonResources },
              };
            }),
        },
      },
      include: {
        lessons: { orderBy: { order: 'asc' }, include: { resources: true } },
        createdBy: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({ course: serializeCourse(course) }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/courses]', error);
    return NextResponse.json({ error: 'Error interno al crear el curso.' }, { status: 500 });
  }
}
