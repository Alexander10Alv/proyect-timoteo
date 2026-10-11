/**
 * Configuración dinámica del sitio (Proyecto Timoteo).
 *
 * Estructura que vive en el modelo `SiteConfig` (BD, JSON). Cada valor tiene
 * un default igual a los textos/imágenes actuales del home, de modo que si no
 * hay nada guardado el sitio se ve exactamente como hoy. El admin puede
 * editar todo desde el panel.
 */

export type SectionButton = {
  label: string;
  color: string; // hex
  /** URL libre del botón */
  href?: string;
  /**
   * id de un artículo (del muro) al que lleva el botón.
   * Más estable que el slug: si el título del artículo cambia, el enlace sigue
   * apuntando al mismo artículo. Si está definido tiene prioridad sobre `href`.
   */
  articleId?: string;
};

/**
 * Destino del botón de un slide. Puede ser un enlace libre (url) o apuntar a
 * un artículo o curso del muro educativo.
 */
export type SlideLink =
  | { type: 'url'; href: string }
  | { type: 'article'; id: string; slug: string }
  | { type: 'course'; id: string };

export type HomeSlide = {
  /** eyebrow del slide (texto pequeño superior, opcional) */
  eyebrow?: string;
  title: string;
  /** palabra destacada del título del slide */
  highlight?: string;
  description: string;
  image: SectionImage;
  buttonLabel: string;
  link: SlideLink;
  /** color de fondo del botón del slide (hex) */
  buttonColor?: string;
  /** color de acento propio del slide (eyebrow y palabra destacada). Si no hay, usa el del tema */
  accent?: string;
  /** alineación del contenido del slide: 'left' (default) o 'center' */
  align?: 'left' | 'center';
};

export type SectionImage = {
  url: string;
  alt?: string;
  position?: 'left' | 'right' | 'bg';
};

/**
 * Video de una sección (p. ej. presentación del equipo en la página de
 * misioneros). URL MP4 directa (/api/uploads/…) o enlace externo.
 * `poster` es una imagen de portada opcional mientras carga el video.
 */
export type SectionVideo = {
  url: string;
  poster?: string;
};

/**
 * Multimedia de un curso destacado en el hero de Educación.
 * 'default' usa la portada del curso; 'image' una imagen propia;
 * 'video' un video corto MP4 (se reproduce como fondo del slide).
 */
export type HomeSlideMedia =
  | { kind: 'default' }
  | { kind: 'image'; url: string; alt?: string }
  | { kind: 'video'; url: string };

export type SectionCard = {
  title: string;
  text: string;
};

export type HomeSection = {
  eyebrow?: string;
  title?: string;
  /** palabra/acento destacado del título (p. ej. hero) */
  highlight?: string;
  description?: string;
  body?: string;
  image?: SectionImage | null;
  /** video de la sección (p. ej. presentación del equipo en el home) */
  video?: SectionVideo | null;
  /** video del hero de la página /misioneros (fondo de la cabecera) */
  heroVideo?: SectionVideo | null;
  /** slides del hero (carrusel, máx. 4) */
  slides?: HomeSlide[];
  buttons?: SectionButton[];
  /** items como listas de texto (p. ej. educación) */
  items?: string[];
  /** cards con título+texto (p. ej. doctrina) */
  cards?: SectionCard[];
  /** stats del hero: [{value, label}] */
  stats?: Array<{ value: string; label: string }>;
  /** ids de misioneros a mostrar en el carrusel (ev. misioneros, máx. 4) */
  missionaryIds?: number[];
  /**
   * Cursos/charlas/eventos destacados en el hero de Educación (sección
   * `educacionHero`). El orden del arreglo es el orden de los slides y la
   * info de cada slide se toma automáticamente del curso.
   */
  courseIds?: string[];
  /** multimedia opcional por curso (por id) en el hero de Educación */
  media?: Record<string, HomeSlideMedia>;
  /** color del botón por curso (por id) en el hero de Educación */
  buttonColors?: Record<string, string>;
  /** cita/cite (secciones tipo esperanza/versículo) */
  quote?: string;
  cite?: string;
};

export type ThemeConfig = {
  primary: string;       // botones principales / acentos
  primaryDark: string;
  accent: string;        // acento (eyebrows, títulos destacados)
  heroBg: string;
  darkSectionBg: string;
  /** color base del botón flotante de donación */
  floatingDonarColor?: string;
};

export type FooterConfig = {
  siteName: string;
  tagline: string;
  showNewsletter: boolean;
};

export type SiteConfigShape = {
  brand: { siteName: string };
  theme: ThemeConfig;
  sections: Record<string, HomeSection>;
  footer: FooterConfig;
};

export const DEFAULT_THEME: ThemeConfig = {
  primary: '#1e3a8a',      // navy (primary-700)
  primaryDark: '#172554',  // navy oscuro (primary-800)
  accent: '#1e40af',
  heroBg: '#0d1226',
  darkSectionBg: '#0b0a10',
  floatingDonarColor: '#1e3a8a',
};

export const DEFAULT_FOOTER: FooterConfig = {
  siteName: 'Proyecto Timoteo',
  tagline:
    'Plataforma ministerial y educativa de alcance global para el avance del evangelio entre las naciones no alcanzadas. Recursos teológicos, formación misionera y oportunidades de colaboración.',
  showNewsletter: true,
};

/**
 * Defaults de contenido con los textos actuales del home.
 * Cada sección se identifica por su clave.
 */
export const DEFAULT_SITE_CONFIG: SiteConfigShape = {
  brand: { siteName: 'Proyecto Timoteo' },
  theme: DEFAULT_THEME,
  sections: {
    hero: {
      eyebrow: 'Para las naciones que aún no han oído',
      title: 'El clamor de los pueblos',
      highlight: 'no alcanzados',
      description:
        'Formamos y enviamos obreros al campo misionero mundial. Doctrina firme, educación accesible y un mapa vivo del avance del evangelio entre cada pueblo, tribu, nación y lengua.',
      buttons: [
        { label: 'Donar Ahora', color: '#3b82f6', href: undefined },
      ],
      stats: [
        { value: '40+', label: 'Años de ministerio' },
        { value: '120', label: 'Países alcanzados' },
        { value: '7K+', label: 'Obreros sostenidos' },
        { value: '100%', label: 'Enfoque en no alcanzados' },
      ],
      slides: [
        {
          eyebrow: 'Para las naciones que aún no han oído',
          title: 'El clamor de los pueblos',
          highlight: 'no alcanzados',
          description:
            'Formamos y enviamos obreros al campo misionero mundial. Doctrina firme, educación accesible y un mapa vivo del avance del evangelio entre cada pueblo, tribu, nación y lengua.',
          image: { url: '', alt: '', position: 'bg' },
          buttonLabel: 'Donar Ahora',
          link: { type: 'url', href: '#donar' },
        },
      ],
    },
    doctrina: {
      eyebrow: 'Nosotros',
      title: 'Misión, Visión y Valores',
      description:
        'Formamos y enviamos obreros a los pueblos que aún no han oído el evangelio.',
      cards: [
        {
          title: 'Misión',
          text: 'Llevar el evangelio a los no alcanzados, formando obreros y equipando a la iglesia global.',
        },
        {
          title: 'Visión',
          text: 'Un movimiento que lleva a Cristo a todo pueblo, tribu, lengua y nación.',
        },
        {
          title: 'Valores',
          text: 'Fidelidad a las Escrituras, oración, colaboración y entrega por los que no han oído.',
        },
      ],
      buttons: [{ label: 'Ver más', color: '#1e3a8a', href: '/nosotros' }],
    },
    misioneros: {
      eyebrow: 'Misioneros',
      title: 'Conoce a los obreros en el campo',
      description:
        'Sostenemos misioneros y sus familias entre los pueblos no alcanzados. Descubre quiénes son y cómo puedes caminar con ellos en oración y provisión.',
      buttons: [{ label: 'Conoce a los misioneros', color: '#1e3a8a', href: '/misioneros' }],
      quote:
        '«Entonces oí la voz del Señor, que decía: ¿A quién enviaré y quién irá por nosotros?…»',
      cite: 'Isaías 6 : 8',
      video: null,
      heroVideo: null,
    },
    enfoque: {
      eyebrow: 'Nuestro Enfoque',
      title: 'Un mapa vivo de la gran comisión',
      description:
        'Cada nodo refleja el avance del evangelio entre los países donde trabajamos, según datos del Joshua Project.',
      buttons: [{ label: 'Ver países', color: '#1e3a8a', href: '/paises' }],
    },
    esperanza: {
      eyebrow: 'Nuestra Esperanza',
      title: '',
      description:
        'Un día la tarea se completará; hasta entonces, trabajamos con urgencia y esperanza.',
      quote:
        '«Vi una gran multitud que nadie podía contar, de toda nación, tribu, pueblo y lengua, de pie delante del trono y del Cordero»',
      cite: 'Apocalipsis 7 : 9 — Nuestra Esperanza',
    },
    articulos: {
      eyebrow: 'Artículos',
      title: 'Reflexiones y recursos misioneros',
      description:
        'Notas, guías y devocionales del equipo sobre el avance del evangelio entre los pueblos no alcanzados.',
    },
    educacion: {
      eyebrow: 'Eventos',
      title: 'Formación teológica accesible para todo el mundo',
      description:
        'Cursos, charlas y eventos gratuitos con reuniones en vivo y grabaciones disponibles. Solo necesitas una cuenta gratuita para desbloquear el contenido completo.',
      items: [
        'Cursos estructurados con sesiones semanales',
        'Charlas magistrales de teólogos y misioneros',
        'Eventos y talleres prácticos presenciales/virtuales',
      ],
      buttons: [{ label: 'Ir al Muro Educativo', color: '#1e3a8a', href: '/educacion' }],
      quote:
        '«Vayan y hagan discípulos a todas las naciones… y he aquí yo estoy con ustedes todos los días.»',
      cite: 'Mateo 28 : 19-20',
    },
    educacionHero: {
      eyebrow: 'Eventos destacados',
      courseIds: [],
      media: {},
      buttonColors: {},
    },
    donacion: {
      eyebrow: '',
      title: 'Sostén a un obrero en el campo',
      description:
        'Tu donación directa financia misioneros, traducciones y proyectos entre pueblos no alcanzados.',
      buttons: [
        { label: 'Orando', color: '#1e3a8a', href: '/articulos?categoria=oraciones' },
        { label: 'Donando', color: '#1e3a8a' },
      ],
    },
  },
  footer: DEFAULT_FOOTER,
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function deepMerge<T>(base: T, override: unknown): T {
  if (override === null || override === undefined) return base;
  if (isPlainObject(base) && isPlainObject(override)) {
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const key of Object.keys(override)) {
      const baseVal = (base as Record<string, unknown>)[key];
      const ovVal = (override as Record<string, unknown>)[key];
      out[key] = deepMerge(baseVal, ovVal);
    }
    return out as T;
  }
  if (Array.isArray(base) && Array.isArray(override)) return override as T;
  return (override as T) ?? base;
}

/**
 * Normalización por bloque (cada bloque vive en su propia columna JSON).
 * Fusiona con los defaults para que ante campos vacíos se use el texto actual.
 */
export const normalizeSections = (raw: unknown): Record<string, HomeSection> =>
  deepMerge(DEFAULT_SITE_CONFIG.sections, raw);
export const normalizeTheme = (raw: unknown): ThemeConfig =>
  deepMerge(DEFAULT_THEME, raw);
export const normalizeFooter = (raw: unknown): FooterConfig =>
  deepMerge(DEFAULT_FOOTER, raw);


