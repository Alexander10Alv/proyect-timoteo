/**
 * Seed de la base de datos heartcry_db (MySQL).
 * Crea el usuario administrador inicial con contraseña hasheada (bcrypt).
 *
 * Uso:  npm run db:seed
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@heartcry.org';
  const passwordHash = await bcrypt.hash('admin123', 10);

  let admin = await prisma.user.findUnique({ where: { email } });

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        name: 'Administrador HeartCry',
        email,
        passwordHash,
        role: 'ADMIN',
        country: 'PER',
        subscription: {
          create: {
            email,
            receiveWhatsApp: false,
            receiveEmail: true,
            enrolledCourses: '[]',
            status: 'ACTIVE',
          },
        },
      },
    });
    console.log('✅ Usuario administrador creado:');
    console.log(`   Email: ${admin.email}`);
    console.log('   Password: admin123');
  } else {
    console.log(`ℹ️  El usuario admin ya existe (${email}).`);
  }

  // ── Seed de cursos de ejemplo con clases (solo si no existen) ──
  const courseCount = await prisma.course.count();
  const skipCourses = courseCount > 0;
  if (skipCourses) {
    console.log(`ℹ️  Ya existen ${courseCount} cursos; se omite el seed de contenido.`);
  }
  if (!skipCourses) {

  await prisma.course.createMany({
    data: [
      {
        id: 'crs-fundamentos',
        title: 'Fundamentos de la Fe Cristiana',
        type: 'COURSE',
        description:
          'Curso introductorio de doctrinas esenciales: la Trinidad, la persona y obra de Cristo, la salvación y la iglesia. Cada sesión incluye video de la clase y material descargable.',
        createdById: admin.id,
      },
      {
        id: 'crs-misiones',
        title: 'Misiones Transculturales: Principios y Práctica',
        type: 'COURSE',
        description:
          'Teología y práctica de las misiones transculturales con estudios de caso reales del campo misionero.',
        coverImage: null,
        createdById: admin.id,
      },
      {
        id: 'crs-charla-oracion',
        title: 'Oración y Avivamiento: Lecciones de la Historia',
        type: 'TALK',
        description:
          'Charla magistral sobre los grandes avivamientos históricos y el papel central de la oración corporativa.',
        createdById: admin.id,
      },
    ],
  });

  await prisma.courseLesson.createMany({
    data: [
      // Fundamentos (4 clases)
      { courseId: 'crs-fundamentos', title: 'Sesión 1: La autoridad de las Escrituras', description: 'Por qué la Biblia es nuestra única regla infalible de fe y práctica.', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', resourcesUrl: 'https://drive.google.com/drive/folders/sesion1-material', durationSeconds: 3245, order: 1 },
      { courseId: 'crs-fundamentos', title: 'Sesión 2: La Trinidad', description: 'Un solo Dios en tres personas: evidencia bíblica e implicaciones prácticas.', videoUrl: 'https://www.youtube.com/watch?v=eRTJPIaUjCY', durationSeconds: 2890, order: 2 },
      { courseId: 'crs-fundamentos', title: 'Sesión 3: La persona y obra de Cristo', description: 'Cristología elemental: humanidad, divinidad y obra redentora.', videoUrl: 'https://www.youtube.com/watch?v=5NV6Rdv1a3I', durationSeconds: 3512, order: 3 },
      { courseId: 'crs-fundamentos', title: 'Sesión 4: La salvación por gracia', description: 'Justificación, adopción y santificación desde una óptica bíblica.', videoUrl: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ', resourcesUrl: 'https://mega.nz/folder/fund-sesion4', durationSeconds: 2977, order: 4 },

      // Misiones (3 clases)
      { courseId: 'crs-misiones', title: 'Clase 1: La base bíblica de las misiones', description: 'De Abraham a Apocalipsis: el hilo misionero de toda la Escritura.', videoUrl: 'https://www.youtube.com/watch?v=hTWKbfoikeg', durationSeconds: 2711, order: 1 },
      { courseId: 'crs-misiones', title: 'Clase 2: Contextualización del evangelio', description: 'Cómo comunicar el evangelio sin sincretismo en culturas diferentes.', videoUrl: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk', resourcesUrl: 'https://drive.google.com/drive/folders/misiones-clase2', durationSeconds: 3105, order: 2 },
      { courseId: 'crs-misiones', title: 'Clase 3: Plantación de iglesias multiplicadoras', description: 'Estrategias probadas para iniciar movimientos de iglesias locales.', videoUrl: 'https://www.youtube.com/watch?v=9bZkp7q19f0', durationSeconds: 2688, order: 3 },

      // Charla (1 clase)
      { courseId: 'crs-charla-oracion', title: 'Charla completa: Oración y Avivamiento', description: 'Análisis histórico de avivamientos y principios de oración corporativa.', videoUrl: 'https://www.youtube.com/watch?v=ZZ5LpwO-An4', durationSeconds: 4180, order: 1 },
    ],
  });

  console.log('✅ Contenido educativo de ejemplo creado: 3 cursos / 8 clases.');
  }

  // ── Seed estructura completa Joshua Project ──
  const jpCount = await prisma.country.count();
  if (jpCount === 0) {
    await prisma.country.createMany({
      data: [
        { countryCode: 'PE', countryName: 'Perú', totalPeopleGroups: 98, unreachedPeopleGroups: 12, unreachedPct: 12.2, frontierPeopleGroups: 7, frontierPct: 7.1, totalPopulation: 33720000n, unreachedPopulation: 4100000n, frontierPopulation: 1900000n, christianAdherentsPct: 94.5, evangelicalPct: 14.2 },
        { countryCode: 'MX', countryName: 'México', totalPeopleGroups: 287, unreachedPeopleGroups: 18, unreachedPct: 6.3, frontierPeopleGroups: 9, frontierPct: 3.1, totalPopulation: 128500000n, unreachedPopulation: 9200000n, frontierPopulation: 3100000n, christianAdherentsPct: 95.2, evangelicalPct: 8.7 },
        { countryCode: 'IN', countryName: 'India', totalPeopleGroups: 2345, unreachedPeopleGroups: 2135, unreachedPct: 91.0, frontierPeopleGroups: 1875, frontierPct: 80.0, totalPopulation: 1408000000n, unreachedPopulation: 1305000000n, frontierPopulation: 1180000000n, christianAdherentsPct: 2.3, evangelicalPct: 0.8 },
      ],
    });
    await prisma.province.createMany({
      data: [
        { provinceId: 'PE.UCY', provinceName: 'Ucayali', countryCode: 'PE', population: 589000n, unreachedCount: 4 },
        { provinceId: 'IN.BR', provinceName: 'Bihar', countryCode: 'IN', population: 128000000n, unreachedCount: 87 },
      ],
    });
    await prisma.ministry.createMany({
      data: [
        { ministryName: 'Traducción bíblica Amazonía', ministryType: 'Traducción', countryCode: 'PE', peopCode: 'PEJ01', contactInfo: 'amazonia@heartcry.org' },
        { ministryName: 'Plantadores del Norte de India', ministryType: 'Plantación de iglesias', countryCode: 'IN', peopCode: 'INB21' },
      ],
    });
    console.log('✅ País/provincias/ministerios JP creados.');
  } else {
    console.log(`ℹ️  Ya existen ${jpCount} países JP; se omite ese seed.`);
  }

  // Upsert de people groups: crea si no existe, actualiza los 4 campos nuevos si ya existe
  const groups = [
    { peopCode: 'PEJ01', countryCode: 'PE', peopleName: 'Shipibo-Conibo', populationInCountry: 32000, isUnreached: true, isFrontier: true, isIndigenous: true, primaryLanguage: 'Shipibo-Conibo', primaryLanguageCode: 'shp', primaryReligion: 'Etnoreligión', evangelicalPct: 1.2, provinceRegion: 'Ucayali', description: 'Pueblo amazónico ribereño conocido por su arte textil y cerámica.', percentAdherents: 5.0, progressScale: 1.5, workersNeeded: 12, countOfCountries: 1 },
    { peopCode: 'PEC02', countryCode: 'PE', peopleName: 'Asháninka', populationInCountry: 97000, populationGlobal: 120000n, isUnreached: false, isIndigenous: true, primaryLanguage: 'Asháninka', primaryLanguageCode: 'cni', primaryReligion: 'Cristianismo animista', evangelicalPct: 6.0, provinceRegion: 'Junín', percentAdherents: 18.0, progressScale: 2.8, workersNeeded: 5, countOfCountries: 1 },
    { peopCode: 'PEQ03', countryCode: 'PE', peopleName: 'Quechua de Cusco', populationInCountry: 1500000, isUnreached: false, isIndigenous: true, primaryLanguage: 'Quechua, Cusco', primaryLanguageCode: 'quz', primaryReligion: 'Catolicismo popular', evangelicalPct: 8.5, provinceRegion: 'Cusco', percentAdherents: 22.0, progressScale: 3.2, workersNeeded: 8, countOfCountries: 3 },
    { peopCode: 'MXM11', countryCode: 'MX', peopleName: 'Mixteco de la Costa', populationInCountry: 85000, isUnreached: true, isFrontier: true, isIndigenous: true, primaryLanguage: 'Mixteco', primaryLanguageCode: 'mxp', primaryReligion: 'Catolicismo animista', evangelicalPct: 2.1, provinceRegion: 'Oaxaca', percentAdherents: 6.5, progressScale: 1.8, workersNeeded: 15, countOfCountries: 1 },
    { peopCode: 'INB21', countryCode: 'IN', peopleName: 'Bhojpuri Bihari', populationInCountry: 185000000, populationGlobal: 211000000n, isUnreached: true, isFrontier: true, primaryLanguage: 'Bhojpuri', primaryLanguageCode: 'bho', primaryReligion: 'Hinduismo', evangelicalPct: 0.1, provinceRegion: 'Bihar', percentAdherents: 0.3, progressScale: 1.1, workersNeeded: 50, countOfCountries: 5 },
  ];

  let created = 0, updated = 0;
  for (const g of groups) {
    const { peopCode, ...data } = g;
    const result = await prisma.peopleGroup.upsert({
      where: { peopCode },
      create: { peopCode, ...data },
      update: { percentAdherents: g.percentAdherents, progressScale: g.progressScale, workersNeeded: g.workersNeeded, countOfCountries: g.countOfCountries },
    });
    if (result.createdAt?.getTime() === result.updatedAt?.getTime()) created++; else updated++;
  }
  console.log(`✅ People groups: ${created} creados, ${updated} actualizados con nuevos campos.`);

  // Seed de idiomas (tabla Language) — upsert idempotente (base tablón Joshua Project)
  const languages = [
    { languageCode: 'shp', languageName: 'Shipibo-Conibo', primaryGroupsCount: 1, unreachedGroupsCount: 1, bibleStatus: 'NEW_TESTAMENT' },
    { languageCode: 'cni', languageName: 'Asháninka', primaryGroupsCount: 1, unreachedGroupsCount: 0, bibleStatus: 'NEW_TESTAMENT' },
    { languageCode: 'quz', languageName: 'Quechua, Cusco', primaryGroupsCount: 1, unreachedGroupsCount: 0, bibleStatus: 'FULL_BIBLE' },
    { languageCode: 'mxp', languageName: 'Mixteco de la Costa', primaryGroupsCount: 1, unreachedGroupsCount: 1, bibleStatus: 'NEW_TESTAMENT' },
    { languageCode: 'bho', languageName: 'Bhojpuri', primaryGroupsCount: 1, unreachedGroupsCount: 1, bibleStatus: 'NONE' },
  ];
  for (const l of languages) {
    await prisma.language.upsert({
      where: { languageCode: l.languageCode },
      create: l,
      update: l,
    });
  }
  console.log(`✅ Idiomas (Language): ${languages.length} sincronizados.`);

  console.log('✅ Joshua Project completo: 3 países / 5 grupos / 2 provincias / 2 ministerios.');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });