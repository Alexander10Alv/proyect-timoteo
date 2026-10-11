/**
 * Serializador compartido entre las rutas /api/courses y /api/courses/[id].
 * Convierte resultados de Prisma (Course + lessons + recursos + autor) al
 * formato JSON que consume el frontend.
 *
 * Nota de compatibilidad: las clases antiguas guardaban un único recurso en
 * resources_url; aquí se expone como una entrada de la lista de recursos.
 */

export interface CourseWithRelations {
  id: string;
  title: string;
  type: string;
  description: string;
  coverImage: string | null;
  modality?: string | null;
  location?: string | null;
  eventDate?: Date | null;
  meetingLink?: string | null;
  recordingLink?: string | null;
  pricePEN?: number | null;
  priceUSD?: number | null;
  capacity?: number | null;
  createdAt: Date;
  updatedAt: Date;
  lessons?: Array<{
    id: string; courseId: string; title: string; description: string | null;
    videoUrl: string; resourcesUrl: string | null; durationSeconds: number | null; order: number;
    resources?: Array<{ id: string; name: string; url: string }>;
  }>;
  createdBy?: { name: string; email: string } | null;
}

export function serializeCourse(course: CourseWithRelations) {
  return {
    id: course.id,
    title: course.title,
    type: course.type,
    description: course.description,
    coverImage: course.coverImage ?? undefined,
    authorName: course.createdBy?.name,
    authorEmail: course.createdBy?.email,
    modality: course.modality ?? undefined,
    location: course.location ?? undefined,
    eventDate: course.eventDate ?? undefined,
    meetingLink: course.meetingLink ?? undefined,
    recordingLink: course.recordingLink ?? undefined,
    pricePEN: course.pricePEN ?? null,
    priceUSD: course.priceUSD ?? null,
    capacity: course.capacity ?? null,
    lessons: (course.lessons ?? []).map((l) => ({
      id: l.id,
      courseId: l.courseId,
      title: l.title,
      description: l.description ?? undefined,
      videoUrl: l.videoUrl,
      resourcesUrl: l.resourcesUrl ?? undefined,
      durationSeconds: l.durationSeconds ?? undefined,
      order: l.order,
      resources: [
        // Legado: recurso único de la versión anterior.
        ...(l.resourcesUrl ? [{ id: `${l.id}-legacy`, name: 'Material de la clase', url: l.resourcesUrl }] : []),
        ...(l.resources ?? []).map((r) => ({ id: r.id, name: r.name, url: r.url })),
      ],
    })),
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  };
}