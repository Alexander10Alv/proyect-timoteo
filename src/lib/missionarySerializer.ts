/**
 * Serializadores de la sección Misioneros.
 * Normalizan fechas/relaciones a objetos planos para JSON y el frontend.
 */

type MissionaryScalar = {
  id: number;
  name: string;
  role: string | null;
  slug: string;
  bio: string | null;
  photoUrl: string | null;
  videoUrl?: string | null;
  status: string;
  countryCode: string | null;
  peopCode: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type MissionaryWithRelations = MissionaryScalar & {
  country?: { countryName: string } | null;
  peopleGroup?: { peopleName: string } | null;
  stories?: {
    id: number;
    missionaryId: number;
    title: string;
    body: string;
    storyDate: Date | null;
    order: number;
  }[];
};

export function serializeStory(s: {
  id: number;
  missionaryId: number;
  title: string;
  body: string;
  storyDate: Date | null;
  order: number;
}) {
  return {
    id: s.id,
    missionaryId: s.missionaryId,
    title: s.title,
    body: s.body,
    storyDate: s.storyDate ? s.storyDate.toISOString() : null,
    order: s.order,
  };
}

export function serializeMissionary(m: MissionaryWithRelations) {
  return {
    id: m.id,
    name: m.name,
    role: m.role,
    slug: m.slug,
    bio: m.bio,
    photoUrl: m.photoUrl,
    videoUrl: m.videoUrl ?? null,
    status: m.status,
    countryCode: m.countryCode,
    countryName: m.country?.countryName ?? null,
    peopCode: m.peopCode,
    peopleName: m.peopleGroup?.peopleName ?? null,
    stories: m.stories ? [...(m.stories.map(serializeStory))].sort((a, b) => a.order - b.order) : [],
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  };
}