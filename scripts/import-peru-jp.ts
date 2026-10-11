import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const JP_API_KEY = process.env.JP_API_KEY;
if (!JP_API_KEY) {
  console.error('Falta JP_API_KEY en variables de entorno (.env)');
  process.exit(1);
}

/**
 * Importa los grupos étnicos de Perú desde la API v1 de Joshua Project
 * y los carga en la base de datos (reemplazando los de prueba).
 *
 * Uso:  npx tsx scripts/import-peru-jp.ts
 *   o:  npm run import:peru
 */

// ── Idiomas con código ISO 639-3 conocido + generador de códigos temporales ──
const knownLanguageCodes: Record<string, string> = {
  'Spanish': 'spa', 'Spanish, Loreto-Ucayali': 'spa',
  'Quechua, Cusco': 'quz', 'Quechua de Cusco': 'quz', 'Quechua, Yauyos': 'quz',
  'Quechua, Ambo-Pasco': 'quz', 'Quechua, Apurimac': 'quz',
  'Quechua, Arequipa': 'quz', 'Quechua, Ayacucho': 'quz',
  'Quechua, Cajamarca': 'quz', 'Quechua, Cerro de Pasco': 'quz',
  'Quechua, Chachapoyas': 'quz', 'Quechua, Huallaga': 'quz',
  'Quechua, Huamalies': 'quz', 'Quechua, Huaylas Ancash': 'quz',
  'Quechua, Jauja Huancayo': 'quz', 'Quechua, Lambayeque': 'quz',
  'Quechua, North Junin': 'quz', 'Quechua, North Lima': 'quz',
  'Quechua, Pachitea': 'quz', 'Quechua, Puno': 'quz',
  'Quechua, San Martin': 'quz', 'Quechua, Sihuas Ancash': 'quz',
  'Quechua, Southern Conchucos Ancash': 'quz', 'Quechua, Southern Huancayo': 'quz',
  'Quechua, Southern Pastaza': 'quz',
  'Quichua, Lowland Napo': 'quc', 'Quichua, Northern Pastaza': 'quc',
  'Shipibo-Conibo': 'shp', 'Shipibol': 'shp', 'Isconahua': 'shp',
  'Asháninka': 'cni', 'Ashaninka': 'cni',
  'Ajyininka Apurucayali': 'cni', 'Asheninka, Pichis': 'cni',
  'Asheninka': 'cni', 'Asheninka, Pajonal': 'cni',
  'Asheninka, Perene': 'cni', 'Asheninka, South Ucayali': 'cni',
  'Asheninka, Ucayali-Yurua': 'cni',
  'Awajun': 'awan', 'Aguaruna': 'agr',
  'Amahuaca, Ipitineri': 'amm', 'Amarakaeri': 'amr',
  'Yanesha': 'yan', 'Kakataibo': 'kak',
  'Kashinawa, Cashinahua': 'kash', 'Yaminahua': 'yad',
  'Shawi': 'shw', 'Yine': 'yne', 'Pisabo': 'pis',
  'Matsigenka, Manaries': 'mpr', 'Matses': 'mth',
  'Wampis': 'wam', 'Nanti': 'nap', 'Caquinte': 'cae',
  'Kandozi-Chapra': 'knd', 'Chayahuita': 'cbt',
  'Capanahua': 'cap', 'Ocaina': 'oci', 'Orejon, Koto': 'oru',
  'Urarina, Shimacu': 'ura', 'Jaqaru': 'jqr',
  'Kulina, Madija': 'kln', 'Secoya, Angotero': 'sey',
  'Sharanahua': 'shs', 'Yora, Manu Park Panoan': 'yrb',
  'Ticuna': 'tic', 'Aymara, Southern': 'aym', 'Aymara, Central': 'aym',
  'Bora': 'bor', 'Witoto, Nipode': 'wit', 'Witoto, Murui': 'wit',
  'Nomatsiguenga': 'nom', 'Maijuna': 'mhh',
  'Chinese, Yue': 'yue', 'Romani, Calo': 'rom',
  'Japanese': 'jpn', 'English': 'eng', 'German, Standard': 'deu',
  'Greek': 'ell', 'Korean': 'kor',
};

let _tmpLangCounter = 0;
const _langCodeByName = new Map<string, string>();
function getLangCode(name: string): string {
  const key = name.trim();
  if (_langCodeByName.has(key)) return _langCodeByName.get(key)!;
  if (knownLanguageCodes[key]) { _langCodeByName.set(key, knownLanguageCodes[key]); return knownLanguageCodes[key]; }
  _tmpLangCounter++;
  const base = key.toLowerCase().replace(/[^a-z]/g, '').slice(0, 3);
  const code = base ? `${base}${_tmpLangCounter}` : `t${_tmpLangCounter}`;
  _langCodeByName.set(key, code);
  return code;
}

// ── Detección de grupos diaspora/inmigrantes ──────────
function isDiasporaGroup(peopleName: string): boolean {
  const patterns = [
    /\bChinese\b/i, /\bCantonese\b/i, /\bJapanese\b/i, /\bKorean\b/i,
    /\bBritish\b/i, /\bGerman\b/i, /\bGreek\b/i,
    /\bJewish\b/i, /\bAmerican\b/i, /\bAmericans\b/i, /\bChilean\b/i,
    /\bColombian\b/i, /\bBrazilian\b/i, /\bAfro\b/i,
    /\bFrench\b/i, /\bItalian\b/i, /\bRussian\b/i,
    /\bLebanese\b/i, /\bSyrian\b/i, /\bArab\b/i,
    /\bCroatian\b/i, /\bBulgarian\b/i, /\bRomanian\b/i,
    /\bHungarian\b/i, /\bPolish\b/i, /\bUkrainian\b/i,
    /\bTurkish\b/i, /\bIranian\b/i, /\bIndian\b/i,
    /\bPakistani\b/i, /\bFilipino\b/i, /\bVietnamese\b/i,
    /\bMexican\b/i, /\bArgentine\b/i,
    /\bCanadian\b/i, /\bAustralian\b/i,
    /\bRomani\b/i,
  ];
  return patterns.some(p => p.test(peopleName));
}

async function main() {
  // ── 1. Consulta a la API de Joshua Project ──────────
  // La API v1 no filtra por ROg3 en el query param → se obtienen hasta 10000
  // registros y se filtra client-side por ROg3 === 'PE'.
  const url = `https://api.joshuaproject.net/v1/people_groups.json?api_key=${JP_API_KEY}&limit=10000`;
  console.log('Fetching:', url);

  const res = await fetch(url);
  if (!res.ok) {
    console.error('Error en la API:', res.status, res.statusText);
    const body = await res.text();
    console.error('Cuerpo (primeros 500 chars):', body.slice(0, 500));
    process.exit(1);
  }

  const json = await res.json();

  // Manejar ambos formatos de respuesta: array directo o envuelto
  let records: any[];
  if (Array.isArray(json)) {
    records = json;
  } else if (json.data && Array.isArray(json.data)) {
    records = json.data;
  } else if (json.api && Array.isArray(json.api)) {
    records = json.api;
  } else {
    records = [json];
  }

  // Filtrar solo grupos de Perú (ROg3 === 'PE')
  const peRecords = records.filter((r: any) => r.ROG3 === 'PE');

  // ── 2. Primer registro crudo para confirmar nombres de campo ──
  console.log('\n--- PRIMER REGISTRO DE PERU ---');
  console.dir(peRecords[0], { depth: null, colors: true });
  console.log('--- FIN PRIMER REGISTRO ---\n');

  console.log('Total registros API:', records.length);
  console.log('Grupos de Per\u00FA (ROg3=PE):', peRecords.length);

  // ── 3. Traer también la página 2 si hace falta ──────
  let allPeRecords = peRecords;
  if (peRecords.length < 103 && records.length >= 10000) {
    const url2 = `https://api.joshuaproject.net/v1/people_groups.json?api_key=${JP_API_KEY}&limit=10000&page=2`;
    console.log('Fetching page 2:', url2);
    const res2 = await fetch(url2);
    if (res2.ok) {
      const json2 = await res2.json();
      let records2: any[];
      if (Array.isArray(json2)) { records2 = json2; }
      else if (json2.data && Array.isArray(json2.data)) { records2 = json2.data; }
      else if (json2.api && Array.isArray(json2.api)) { records2 = json2.api; }
      else { records2 = [json2]; }
      const peRecords2 = records2.filter((r: any) => r.ROG3 === 'PE');
      const existingIds = new Set(allPeRecords.map((r: any) => r.PeopleID3ROG3));
      for (const r of peRecords2) {
        if (!existingIds.has(r.PeopleID3ROG3)) {
          allPeRecords.push(r);
          existingIds.add(r.PeopleID3ROG3);
        }
      }
    }
  }

  console.log('Total grupos PE (con paginación):', allPeRecords.length);

  // ── 4. Actualizar PeopleGroup de Perú (upsert, no duplicar) ──────────
  _tmpLangCounter = 0;

  // ── Recopilar idiomas distintos y asignar códigos ──────
  const langCodeMap = new Map<string, string>();
  const codeMap = new Map<string, { names: string[]; total: number; unreached: number }>();
  for (const r of allPeRecords) {
    const name = r.PrimaryLanguageName ?? r.primaryLanguageName ?? r.primarylanguageName ?? '';
    if (!name) continue;
    const code = getLangCode(name);
    if (!langCodeMap.has(name)) langCodeMap.set(name, code);
    const cur = codeMap.get(code) ?? { names: [], total: 0, unreached: 0 };
    cur.names.push(name);
    cur.total += 1;
    const unreached = r.LeastReached === 'Y' || r.LeastReached === true || r.LeastReached === 1 || r.LeastReached === '1';
    if (unreached) cur.unreached += 1;
    codeMap.set(code, cur);
  }

  // Upsert de Language por cada código único ──────
  for (const [code, info] of codeMap) {
    await prisma.language.upsert({
      where: { languageCode: code },
      create: {
        languageCode: code,
        languageName: info.names[0],
        primaryGroupsCount: info.total,
        unreachedGroupsCount: info.unreached,
        bibleStatus: 'UNSPECIFIED',
      },
      update: {
        languageName: info.names[0],
        primaryGroupsCount: info.total,
        unreachedGroupsCount: info.unreached,
      },
    });
    console.log(`Language upsertada: ${code} (${info.names[0]}) → ${info.total} grupos, ${info.unreached} no alcanzados`);
  }

  // ── Transacción: upsert PeopleGroup (no duplica, solo actualiza) ─────────────────────
  await prisma.$transaction(async (tx) => {
    for (const r of allPeRecords) {
      const peopleName = r.PeopNameInCountry ?? r.peopleName ?? r.peopleNameInCountry;
      if (!peopleName) continue;

      // Deriva peopCode; el formato exacto lo confirma el usuario
      // con el primer registro crudo (PeopleID3).
      const rawID3 = r.PeopleID3 ?? r.peopleID3 ?? r.peopleid3;
      const peopCode = rawID3 != null ? `PE${rawID3}` : undefined;

      const languageName = r.PrimaryLanguageName ?? r.primaryLanguageName ?? '';
      const langCode = langCodeMap.get(languageName) ?? null;

      const isUnreached = r.LeastReached === 'Y' || r.LeastReached === true || r.LeastReached === 1 || r.LeastReached === '1';
      const isFrontier = r.Frontier === 'Y' || r.Frontier === true || r.Frontier === 1 || r.Frontier === '1';

      console.log(`[${peopCode ?? '?'}] ${peopleName} | lang=${languageName} (${langCode ?? '—'}) | pop=${r.Population} | unreached=${isUnreached} | frontier=${isFrontier} | JPScale=${r.JPScale} | lat=${r.Latitude} | lng=${r.Longitude}`);

      const diaspora = isDiasporaGroup(peopleName);
      const isIndigenous = diaspora ? false : true;
      const isDiaspora = diaspora ? true : false;

      const groupData: any = {
        countryCode: 'PE',
        peopleName,
        populationInCountry: r.Population != null ? Number(r.Population) : undefined,
        populationGlobal: null,
        isUnreached,
        isFrontier,
        isIndigenous,
        isDiaspora,
        primaryLanguage: languageName || undefined,
        primaryLanguageCode: langCode ?? null,
        primaryReligion: r.PrimaryReligion ?? undefined,
        evangelicalPct: r.PercentEvangelical != null ? Number(r.PercentEvangelical) : undefined,
        percentAdherents: r.PercentAdherents != null ? Number(r.PercentAdherents) : undefined,
        progressScale: r.JPScale != null ? Number(r.JPScale) : undefined,
        provinceRegion: r.RegionName ?? undefined,
        workersNeeded: null,
        description: null,
        photoUrl: null,
        countOfCountries: null,
        latitude: r.Latitude != null ? Number(r.Latitude) : null,
        longitude: r.Longitude != null ? Number(r.Longitude) : null,
      };

      await tx.peopleGroup.upsert({
        where: { peopCode: peopCode ?? '__none__' },
        create: { peopCode: peopCode ?? `UNKNOWN_${Date.now()}`, ...groupData },
        update: groupData,
      });
    }
  });

  console.log('\n✅ Importación de Perú completada (upsert con lat/long).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
