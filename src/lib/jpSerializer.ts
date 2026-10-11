/**
 * Serializadores de la estructura completa Joshua Project.
 * Convierten BigInt → Number (poblaciones caben en 2^53) para que
 * JSON.stringify no falle y el frontend reciba números normales.
 */

type WithBigNums<T> = {
  [K in keyof T]: T[K] extends bigint ? number : T[K] extends bigint | null ? number | undefined : T[K];
};

/** Campos escalares de un Country (acepta payloads con relaciones incluidas). */
type JpCountryInput = {
  countryCode: string;
  countryName: string;
  totalPeopleGroups: number;
  unreachedPeopleGroups: number;
  unreachedPct: number;
  frontierPeopleGroups: number;
  frontierPct: number;
  totalPopulation: bigint | number;
  unreachedPopulation: bigint | number;
  frontierPopulation: bigint | number;
  christianAdherentsPct: number;
  evangelicalPct: number;
  flagUrl: string | null;
  heroImage: string | null;
  primaryLanguage?: string | null;
  primaryReligion?: string | null;
};

export function serializeJpCountry(c: JpCountryInput) {
  return {
    countryCode: c.countryCode,
    countryName: c.countryName,
    totalPeopleGroups: c.totalPeopleGroups,
    unreachedPeopleGroups: c.unreachedPeopleGroups,
    unreachedPct: c.unreachedPct,
    frontierPeopleGroups: c.frontierPeopleGroups,
    frontierPct: c.frontierPct,
    totalPopulation: Number(c.totalPopulation),
    unreachedPopulation: Number(c.unreachedPopulation),
    frontierPopulation: Number(c.frontierPopulation),
    christianAdherentsPct: c.christianAdherentsPct,
    evangelicalPct: c.evangelicalPct,
    flagUrl: c.flagUrl ?? undefined,
    heroImage: c.heroImage ?? undefined,
    primaryLanguage: c.primaryLanguage ?? undefined,
    primaryReligion: c.primaryReligion ?? undefined,
  };
}

export function serializePeopleGroup(g: {
  id: string; peopCode: string; countryCode: string; peopleName: string;
  populationInCountry: number; populationGlobal: bigint | null;
  isUnreached: boolean; isFrontier: boolean; isIndigenous: boolean; isDiaspora: boolean;
  primaryLanguage: string; primaryLanguageCode: string | null;
  primaryReligion: string; evangelicalPct: number | null;
  percentAdherents: number | null; progressScale: number | null;
  workersNeeded: number | null; countOfCountries: number | null;
  provinceRegion: string | null; description: string | null; photoUrl: string | null;
  latitude: number | null; longitude: number | null;
}): WithBigNums<typeof g> {
  return {
    ...g,
    populationGlobal: g.populationGlobal != null ? Number(g.populationGlobal) : undefined,
  };
}

export function serializeProvince(p: {
  provinceId: string; provinceName: string; countryCode: string;
  population: bigint | null; unreachedCount: number | null;
}): WithBigNums<typeof p> {
  return { ...p, population: p.population != null ? Number(p.population) : undefined };
}

export function serializeMinistry(m: {
  id: number; ministryName: string; ministryType: string | null;
  countryCode: string | null; peopCode: string | null; contactInfo: string | null;
}) {
  return { ...m };
}