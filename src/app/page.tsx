'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store';
import { useSiteStore } from '@/store/siteStore';
import { WorldMap } from '@/components/map/WorldMap';
import { CountryModal } from '@/components/modals/CountryModal';
import { Button, Card, Skeleton } from '@/components/ui';
import { ArticleCard } from '@/components/articles/ArticleCard';
import { HeartBurst } from '@/components/effects/HeartBurst';
import { Reveal } from '@/components/effects/Reveal';
import { BookOpen, Globe2, HeartHandshake, ArrowRight, Quote, Church, Compass, Sunrise, Newspaper, ChevronLeft, ChevronRight, Telescope, MapPin } from 'lucide-react';
import type { Article, JoshuaProjectCountry, Missionary } from '@/types';
import type { HomeSection, SectionButton, ThemeConfig } from '@/lib/siteConfig';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const countries = useAppStore((s) => s.countries);
  const countriesLoading = useAppStore((s) => s.countriesLoading);
  const openDonationModal = useAppStore((s) => s.openDonationModal);
  const fetchPublishedArticles = useAppStore((s) => s.fetchPublishedArticles);

  const sections = useSiteStore((s) => s.sections);
  const theme = useSiteStore((s) => s.theme);

  const [modalCountry, setModalCountry] = React.useState<JoshuaProjectCountry | null>(null);
  const [latestArticles, setLatestArticles] = React.useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = React.useState(true);

  React.useEffect(() => {
    fetchPublishedArticles()
      .then((list) => setLatestArticles(list.slice(0, 3)))
      .catch(() => undefined)
      .finally(() => setArticlesLoading(false));
  }, [fetchPublishedArticles]);

  const hero = sections.hero ?? {};
  const doctrina = sections.doctrina ?? {};
  const misioneros = sections.misioneros ?? {};
  const enfoque = sections.enfoque ?? {};
  const esperanza = sections.esperanza ?? {};
  const articulos = sections.articulos ?? {};
  const educacion = sections.educacion ?? {};
  const donacion = sections.donacion ?? {};

  // Tema como variables CSS aplicadas a todo el home.
  const themeStyle: React.CSSProperties = {
    ['--cfg-primary' as string]: theme.primary,
    ['--cfg-primaryDark' as string]: theme.primaryDark,
    ['--cfg-accent' as string]: theme.accent,
    ['--cfg-darkSection' as string]: theme.darkSectionBg,
  } as React.CSSProperties;

  return (
    <div style={themeStyle}>
      <FloatingDonateButton label={hero.buttons?.[0]?.label ?? 'Donar'} color={theme.floatingDonarColor} onClick={() => openDonationModal()} />
      <HeroSection hero={hero} openDonationModal={openDonationModal} />
      <DonacionSection donacion={donacion} openDonationModal={openDonationModal} />
      <MisionerosSection misioneros={misioneros} />
      <EnfoqueSection
        enfoque={enfoque}
        countries={countries}
        loading={countriesLoading}
        onSelectCountry={(c) => setModalCountry(c)}
      />
      <EsperanzaSection esperanza={esperanza} />
      <ArticulosSection
        articulos={articulos}
        latestArticles={latestArticles}
        loading={articlesLoading}
      />
      <EducacionSection educacion={educacion} />
      <DoctrinaSection doctrina={doctrina} />

      <CountryModal isOpen={!!modalCountry} onClose={() => setModalCountry(null)} country={modalCountry} />
    </div>
  );
}

/* ─────────────────────────── HERO CARRUSEL ─────────────────────────── */
function HeroSection({
  hero,
  openDonationModal,
}: {
  hero: HomeSection;
  openDonationModal: (id?: string) => void;
}) {
  const theme = useSiteStore((s) => s.theme);

  // Los slides del carrusel provienen de hero.slides (hasta 4). Si no hay,
  // usamos un slide de respaldo con el contenido actual.
  const slides = hero.slides && hero.slides.length > 0 ? hero.slides : [compatSlide(hero)];

  return (
    <HeroCarousel
      slides={slides}
      theme={theme}
      eyebrow={hero.eyebrow ?? ''}
      openDonationModal={openDonationModal}
    />
  );
}

function compatSlide(hero: HomeSection) {
  return {
    title: hero.title ?? '',
    highlight: hero.highlight,
    description: hero.description ?? '',
    image: hero.image ?? { url: '', alt: '', position: 'bg' },
    buttonLabel: hero.buttons?.[0]?.label ?? 'Donar Ahora',
    link: { type: 'url' as const, href: '#donar' },
    align: 'left' as const,
  };
}

function HeroCarousel({
  slides,
  theme,
  eyebrow,
  openDonationModal,
}: {
  slides: NonNullable<HomeSection['slides']>;
  theme: ThemeConfig;
  eyebrow: string;
  openDonationModal: (id?: string) => void;
}) {
  const [index, setIndex] = React.useState(0);
  const total = Math.min(slides.length, 4);

  // Auto-play
  React.useEffect(() => {
    if (total <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % total), 60000);
    return () => clearInterval(t);
  }, [total]);

  const go = (n: number) => setIndex(((n % total) + total) % total);

  if (total === 0) return null;
  const slide = slides[index];

  return (
    <section
      className="relative flex min-h-[560px] items-center overflow-hidden text-white md:min-h-[620px] lg:min-h-[700px]"
      style={{ backgroundColor: theme.heroBg }}
    >
      {/* Fondo: degradado limpio azul marino + glows sutiles */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-950/40 to-[#0b0a10]" />
        <div
          className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[720px] -translate-x-1/2 rounded-full opacity-40 blur-[120px]"
          style={{ background: `radial-gradient(circle, ${theme.accent} 0%, transparent 70%)` }}
        />
        <div
          className="pointer-events-none absolute bottom-[-8rem] right-[-4rem] h-[420px] w-[420px] rounded-full bg-primary-500/15 blur-[110px] animate-bob"
          style={{ backgroundColor: `${theme.primary}26` }}
        />
        <div
          className="pointer-events-none absolute bottom-[-6rem] left-[-6rem] h-[380px] w-[380px] rounded-full bg-sky-500/15 blur-[100px] animate-bob"
          style={{ animationDelay: '-3s', backgroundColor: '#0ea5e926' }}
        />
      </div>

      {/* Slides apilados con fade (imágenes de fondo) */}
      {slides.slice(0, total).map((s, i) => (
        <div
          key={i}
          className={cn(
            'absolute inset-0 transition-opacity duration-700',
            i === index ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          aria-hidden={i !== index}
        >
          {s.image && s.image.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={s.image.url}
              alt={s.image.alt ?? ''}
              className="animate-kenburns pointer-events-none h-full w-full object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="pointer-events-none h-full w-full opacity-[0.07]"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 25% 25%, #38bdf8 1px, transparent 1px), radial-gradient(circle at 75% 75%, #3b82f6 1px, transparent 1px)',
                backgroundSize: '48px 48px',
              }}
            />
          )}
        </div>
      ))}

      {/* Contenido del slide activo */}
      <div className="relative z-10 w-full mx-auto max-w-7xl px-4 pt-24 pb-24 sm:px-6 lg:px-8 lg:pt-28 lg:pb-28">
        <div key={index} className={cn('max-w-3xl', slide.align === 'center' ? 'mx-auto text-center' : 'text-left sm:pl-6 lg:pl-12')}>
          {/* Píldora de bienvenida */}
          <div
            className={cn(
              'hero-reveal inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-body-sm font-bold uppercase tracking-[0.3em] backdrop-blur-md',
              slide.align === 'center' ? 'mx-auto' : ''
            )}
            style={{ color: slide.accent ?? theme.accent, animationDelay: '0.05s' }}
          >
            <HeartHandshake className="h-5 w-5" aria-hidden="true" />
            {(slide.eyebrow || eyebrow)}
          </div>

          <h1
            className="hero-reveal mt-6 font-display text-display-md font-bold leading-[1.05] lg:text-display-lg"
            style={{ animationDelay: '0.15s' }}
          >
            {slide.title}{' '}
            {slide.highlight && (
              <span
                className="relative inline-block italic"
                style={{ color: slide.accent ?? theme.accent }}
              >
                {slide.highlight}
                <span
                  aria-hidden="true"
                  className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full opacity-70"
                  style={{ backgroundColor: slide.accent ?? theme.accent }}
                />
              </span>
            )}
          </h1>

          <div className={cn('mt-6 max-w-2xl', slide.align === 'center' && 'mx-auto')}>
            <p
              className="hero-reveal text-body-lg leading-relaxed text-white/90"
              style={{ animationDelay: '0.28s' }}
            >
              {slide.description}
            </p>
          </div>

          <div
            className={cn('mt-8 flex flex-wrap items-center gap-4', slide.align === 'center' && 'justify-center')}
            style={{ animationDelay: '0.4s' }}
          >
            <div className="hero-reveal">
              <SlideButton slide={slide} theme={theme} openDonationModal={openDonationModal} />
            </div>
          </div>
        </div>
      </div>

      {/* Flechas */}
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Slide anterior"
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full border-2 border-emerald-400 bg-emerald-900/80 text-white backdrop-blur transition-all hover:bg-emerald-800/80 hover:shadow-[0_0_25px_rgba(16,185,129,0.8)] hover:ring-2 hover:ring-emerald-300/60 hover:scale-110"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Slide siguiente"
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full border-2 border-emerald-400 bg-emerald-900/80 text-white backdrop-blur transition-all hover:bg-emerald-800/80 hover:shadow-[0_0_25px_rgba(16,185,129,0.8)] hover:ring-2 hover:ring-emerald-300/60 hover:scale-110"
          >
            <ChevronRight className="h-6 w-6" aria-hidden="true" />
          </button>
        </>
      )}

      {/* Indicadores (puntos) */}
      {total > 1 && (
        <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ir al slide ${i + 1}`}
              className={cn(
                'h-2.5 rounded-full transition-all',
                i === index ? 'w-8 bg-emerald-400' : 'w-2.5 bg-white/40'
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function SlideButton({
  slide,
  theme,
  openDonationModal,
}: {
  slide: NonNullable<HomeSection['slides']>[number];
  theme: ThemeConfig;
  openDonationModal: (id?: string) => void;
}) {
  const handle = (e: React.MouseEvent) => {
    if (slide.link.type === 'url' && (slide.link.href === '#donar' || slide.link.href === '#')) {
      e.preventDefault();
      openDonationModal();
      return;
    }
    // Los enlaces de artículos/cursos son <a>; se navega normal.
  };

  const href = slideHref(slide.link);
  const bg = slide.buttonColor || theme.primary;

  return (
    <a
      href={href}
      onClick={handle}
      className="group relative inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-lg font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
      style={{ backgroundColor: bg, boxShadow: `0 8px 24px ${bg}55` }}
    >
      <span className="inline-flex items-center gap-2">
        {slide.buttonLabel || 'Donar Ahora'}
        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </span>
    </a>
  );
}

/** Resuelve el href de un destino de slide. */
function slideHref(link: NonNullable<HomeSection['slides']>[number]['link']): string {
  if (link.type === 'url') return link.href;
  if (link.type === 'article') return `/articulos/${link.slug}`;
  return `/cursos/${link.id}`;
}

/* ─────────────────────────── NOSOTROS ─────────────────────────── */
function DoctrinaSection({ doctrina }: { doctrina: HomeSection }) {
  const theme = useSiteStore((s) => s.theme);
  const icons = [Globe2, Telescope, HeartHandshake];
  const cards = doctrina.cards ?? [];
  const btn = doctrina.buttons?.[0];
  const featured = cards[0];
  const rest = cards.slice(1);
  return (
    <section id="nosotros" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col items-start gap-4 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          eyebrow={doctrina.eyebrow}
          title={doctrina.title}
          titleClassName="!text-heading-xl"
          description={doctrina.description}
          accent={theme.accent}
        />
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-12">
        {/* Tarjeta destacada (Misión) */}
        {featured && (
          <Reveal from="left" className="lg:col-span-7">
            <div
              className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl p-6 text-white shadow-xl sm:p-7"
              style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}
            >
              <span
                aria-hidden="true"
                className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-20"
                style={{ background: theme.accent }}
              />
              <span aria-hidden="true" className="absolute -bottom-12 right-14 h-32 w-32 rounded-full border border-white/20" />
              <div className="relative flex items-center gap-2 text-caption font-semibold uppercase tracking-[0.2em] text-white/70">
                <Globe2 className="h-4 w-4" aria-hidden="true" />
                01
              </div>
              <div className="relative mt-3">
                <h3 className="font-serif text-heading-lg font-semibold text-white">{featured.title}</h3>
                <p className="mt-2 max-w-md text-body-md leading-relaxed text-white/85">{featured.text}</p>
              </div>
              <div aria-hidden="true" className="relative mt-4 h-1.5 w-14 rounded-full bg-white/30" />
            </div>
          </Reveal>
        )}

        {/* Resto de tarjetas (Visión, Valores) */}
        {rest.length > 0 && (
          <div className="grid gap-5 lg:col-span-5">
            {rest.map((item, i) => {
              const Icon = icons[(i % icons.length) + 1] ?? Compass;
              const from = (['right', 'top'] as const)[i % 2];
              return (
                <Reveal key={item.title} from={from} delay={i * 150}>
                  <Card variant="outlined" padding="md" className="group h-full transition-all hover:-translate-y-1 hover:shadow-lg">
                    <div className="flex items-start gap-4">
                      <span
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                        style={{ backgroundColor: `${theme.primary}1a` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: theme.primary }} strokeWidth={2.2} aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-caption font-semibold uppercase tracking-[0.2em] text-dark-400 dark:text-dark-500">
                          0{i + 2}
                        </p>
                        <h3 className="mt-1 font-serif text-heading-lg font-semibold text-dark-950 dark:text-dark-50">{item.title}</h3>
                      </div>
                    </div>
                    <p className="mt-3 text-body-md text-dark-700 dark:text-dark-300">{item.text}</p>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>

      {btn?.href && (
        <div className="mt-8 flex justify-center">
          <Link
            href={btn.href}
            className="group inline-flex items-center gap-2 rounded-full px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
            style={{ backgroundColor: btn.color || theme.primary }}
          >
            {btn.label}
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
      )}
    </section>
  );
}

/* ─────────────────────────── MISIONEROS CTA ─────────────────────────── */
function MisionerosSection({ misioneros }: { misioneros: HomeSection }) {
  const theme = useSiteStore((s) => s.theme);
  const btn = misioneros.buttons?.[0];
  const missionaries = useAppStore((s) => s.missionaries);
  const fetchMissionaries = useAppStore((s) => s.fetchMissionaries);

  React.useEffect(() => {
    void fetchMissionaries();
  }, [fetchMissionaries]);

  const slider = React.useMemo(() => {
    const ids = misioneros.missionaryIds ?? [];
    if (ids.length > 0) {
      const selected = ids
        .map((id) => missionaries.find((m) => m.id === id))
        .filter((m): m is Missionary => !!m && !!m.photoUrl)
        .slice(0, 4);
      if (selected.length > 0) return selected;
    }
    return [...missionaries]
      .filter((m) => m.photoUrl)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 4);
  }, [missionaries, misioneros.missionaryIds]);

  return (
    <section id="misioneros" className="relative scroll-mt-24 overflow-hidden">
      {/* Fondo: si hay video configurado, reemplaza el cielo anime por el video */}
      {misioneros.video?.url ? (
        <>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            src={misioneros.video.url}
            poster={misioneros.video.poster ?? undefined}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 z-0 h-full w-full object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 z-0 bg-dark-950/30" />
        </>
      ) : (
        <>
          <div className="sky-anime absolute inset-0 z-0" aria-hidden="true" />

          {/* Nubes a la deriva */}
          <div className="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
            {[
              { top: '6%', w: 220, h: 84, d: 55, a: -18, o: 0.5 },
              { top: '17%', w: 320, h: 110, d: 72, a: -42, o: 0.42 },
              { top: '44%', w: 190, h: 70, d: 48, a: -8, o: 0.4 },
              { top: '62%', w: 280, h: 95, d: 68, a: -30, o: 0.38 },
            ].map((c, i) => (
              <div
                key={i}
                className="cloud-drift absolute"
                style={{ top: c.top, animationDuration: `${c.d}s`, animationDelay: `${c.a}s` }}
              >
                <div
                  className="sky-cloud relative"
                  style={{ width: c.w, height: c.h, opacity: c.o }}
                >
                  <span className="absolute block rounded-full bg-white" style={{ top: '-35%', left: '16%', width: '55%', height: '85%' }} />
                  <span className="absolute block rounded-full bg-white" style={{ top: '-50%', left: '38%', width: '62%', height: '95%' }} />
                  <span className="absolute block rounded-full bg-white" style={{ top: '-18%', left: '62%', width: '48%', height: '70%' }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="relative z-20 mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <p
              className="mb-3 flex items-center justify-center gap-3 text-caption uppercase tracking-[0.25em] lg:justify-start"
              style={{ color: theme.accent }}
            >
              <span className="hidden lg:block h-px w-10" style={{ backgroundColor: `${theme.accent}80` }} aria-hidden="true" />
              {misioneros.eyebrow}
            </p>
            <h2 className="mt-4 font-serif text-display-md font-semibold text-white dark:text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.35)]">{misioneros.title}</h2>
            <p className="mx-auto mt-6 max-w-xl text-body-lg text-white/90 lg:mx-0 [text-shadow:0_1px_10px_rgba(0,0,0,0.3)]">{misioneros.description}</p>
            {btn?.href && (
              <div className="mt-8 flex justify-center lg:justify-start">
                <Link href={btn.href} className="inline-block transition-transform duration-200 hover:-translate-y-0.5 hover:scale-[1.02]">
                  <Button size="lg" style={{ backgroundColor: btn.color }}>
                    {btn.label}
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
          <MissionaryCarousel missionaries={slider} primary={theme.primary} primaryDark={theme.primaryDark} />
        </div>
      </div>
    </section>
  );
}

/* ────────────────────── CARRUSEL DE MISIONEROS (MAZO ANIMADO) ────────────────────── */
function MissionaryCarousel({
  missionaries,
  primary,
  primaryDark,
}: {
  missionaries: Missionary[];
  primary?: string;
  primaryDark?: string;
}) {
  const router = useRouter();
  const [index, setIndex] = React.useState(0);
  const [anim, setAnim] = React.useState<{ from: number; to: number } | null>(null);
  const [stage, setStage] = React.useState<0 | 1>(0);
  const total = missionaries.length;

  const cPrimary = primary ?? '#7c3aed';
  const cDark = primaryDark ?? '#6d28d9';

  const indexRef = React.useRef(0);
  const animRef = React.useRef<{ from: number; to: number } | null>(null);
  indexRef.current = index;
  animRef.current = anim;

  const mod = (n: number) => ((n % total) + total) % total;

  React.useEffect(() => {
    setIndex(0);
    setAnim(null);
    if (total <= 1) return;
    const t = setInterval(() => {
      if (!animRef.current) go(indexRef.current + 1);
    }, 4500);
    return () => clearInterval(t);
  }, [total]);

  const go = (n: number) => {
    if (animRef.current || total <= 1) return;
    const cur = indexRef.current;
    const to = ((n % total) + total) % total;
    if (to === cur) return;
    setAnim({ from: cur, to });
    setStage(0);
    setTimeout(() => setStage(1), 460);
    setTimeout(() => {
      setIndex(to);
      setAnim(null);
    }, 920);
  };

  if (total === 0) {
    return (
      <div className="mx-auto aspect-[3/4] w-full max-w-[320px] rounded-sm p-1.5" style={{ border: `5px solid ${cDark}` }}>
        <div className="flex h-full w-full items-center justify-center rounded-sm border-[3px] border-black bg-[#0a0011]">
          <Compass className="h-12 w-12 text-white" aria-hidden="true" />
        </div>
      </div>
    );
  }

  const fwd = anim && anim.to === mod(anim.from + 1) ? 1 : -1;
  const leftPeek = `translateX(calc(-50% - 7%)) translateY(9%) scale(0.97) rotate(2deg)`;
  const rightPeek = `translateX(calc(-50% + 7%)) translateY(9%) scale(0.97) rotate(-2deg)`;
  const home = 'translateX(-50%)';
  const riseStart = `translateX(-50%) translateY(48%) scale(0.9) rotate(0deg)`;
  const fallStart = `translateX(-50%) translateY(28%) scale(0.93) rotate(${fwd * 4}deg)`;
  const hidePeek = `translateX(-50%) translateY(52%) scale(0.9)`;

  const getCard = (i: number) =>
    anim
      ? i === anim.from
        ? { key: 'top', id: i }
        : i === anim.to
        ? { key: 'rise', id: i }
        : fwd === 1
        ? i === mod(anim.to + 1)
          ? { key: 'newPeek', id: i }
          : i === mod(anim.from - 1)
          ? { key: 'dim', id: i }
          : { key: 'hidden', id: i }
        : fwd === -1
        ? i === mod(anim.to - 1)
          ? { key: 'newPeek', id: i }
          : i === mod(anim.from + 1)
          ? { key: 'dim', id: i }
          : { key: 'hidden', id: i }
        : { key: 'hidden', id: i }
      : (() => {
          const d = ((i - index) % total + total) % total;
          const r = Math.min(d, total - d);
          if (d === 0) return { key: 'idle-top', id: i };
          if (r === 1) return { key: d === 1 ? 'idle-left' : 'idle-right', id: i };
          return { key: 'hidden', id: i };
        })();

  const visuals: Record<string, { t: string; v: number; z: number }> = {
    'idle-top': { t: home, v: 1, z: 30 },
    'idle-left': { t: leftPeek, v: 0.92, z: 20 },
    'idle-right': { t: rightPeek, v: 0.92, z: 20 },
    'dim': { t: stage === 1 ? hidePeek : fwd === 1 ? rightPeek : leftPeek, v: stage === 1 ? 0 : 0.9, z: stage === 1 ? 2 : 10 },
    'hidden': { t: hidePeek, v: 0, z: 1 },
  };

  const animLike = (role: string): { t: string; v: number; z: number } => {
    if (role === 'top')
      return stage === 0 ? { t: fallStart, v: 0.95, z: 30 } : { t: fwd === 1 ? rightPeek : leftPeek, v: 0.88, z: 12 };
    if (role === 'rise')
      return stage === 0 ? { t: riseStart, v: 0.85, z: 2 } : { t: home, v: 1, z: 30 };
    if (role === 'newPeek')
      return stage === 0
        ? { t: riseStart, v: 0.8, z: 1 }
        : { t: fwd === 1 ? leftPeek : rightPeek, v: 0.9, z: 14 };
    return visuals['hidden'];
  };

  return (
    <div className="relative w-full pb-24">
      {/* Elemento invisible que da altura al mazo */}
      <div aria-hidden="true" className="invisible aspect-[3/4] w-56 sm:w-60" />

      {missionaries.map((m, i) => {
        const isTop = anim ? i === anim.from : i === index;
        const role = getCard(i);
        const vis = anim ? animLike(role.key) : visuals[role.key];

        if (anim && role.key === 'hidden') return null;

        return (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              if (!anim && isTop) {
                router.push(`/misioneros/${m.slug}`);
              } else setIndex(i);
            }}
            disabled={!!anim}
            aria-label={anim || !isTop ? `Seleccionar misionero ${m.name}` : `Ver misionero ${m.name}`}
            className={cn(
              'absolute left-1/2 top-0 aspect-[3/4] w-56 overflow-hidden rounded-sm p-1.5 sm:w-60',
              anim ? 'transition-all duration-500 ease-in-out' : 'transition-all duration-500',
              anim ? undefined : 'group',
              anim ? undefined : isTop ? 'z-30' : 'z-20',
              anim ? undefined : isTop ? 'opacity-100' : 'opacity-90'
            )}
            style={{
              transform: vis.t,
              opacity: vis.v,
              zIndex: anim ? vis.z : undefined,
              visibility: vis.v === 0 ? 'hidden' : 'visible',
              border: (anim ? role.key === 'top' || role.key === 'rise' : isTop) ? `5px solid ${cDark}` : `3px solid ${cPrimary}`,
            }}
          >
            <div className="relative h-full w-full overflow-hidden rounded-sm border-[3px] border-black transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-xl">
              {m.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.photoUrl} alt={m.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: cDark }}>
                  <span className="font-serif text-display-md font-bold text-white">{m.name.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 px-2.5 pb-2 pt-1.5" style={{ backgroundColor: cDark }}>
                <p className="truncate font-serif text-heading-sm font-bold text-white">{m.name}</p>
                {m.role && <p className="mt-0.5 truncate text-caption font-semibold text-white">{m.role}</p>}
              </div>
            </div>
          </button>
        );
      })}

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Misionero anterior"
            className="absolute left-0 top-1/2 z-40 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-black text-white transition-transform hover:scale-110"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Misionero siguiente"
            className="absolute right-0 top-1/2 z-40 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-black text-white transition-transform hover:scale-110"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────── ENFOQUE (MAPA) ─────────────────────────── */
function EnfoqueSection({
  enfoque,
  countries,
  loading,
  onSelectCountry,
}: {
  enfoque: HomeSection;
  countries: JoshuaProjectCountry[];
  loading: boolean;
  onSelectCountry: (c: JoshuaProjectCountry) => void;
}) {
  const theme = useSiteStore((s) => s.theme);
  const btn = enfoque.buttons?.[0];

  return (
    <section
      id="mapa"
      className="relative scroll-mt-24 overflow-hidden py-10 sm:py-14"
      style={{ backgroundColor: '#0d1226' }}
    >
      {/* Glows suaves */}
      <div className="pointer-events-none absolute -top-24 right-[-4rem] h-80 w-80 rounded-full opacity-20 blur-3xl animate-bob" style={{ background: `radial-gradient(circle, ${theme.accent}, transparent 70%)` }} aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-[-4rem] left-[-6rem] h-72 w-72 rounded-full bg-sky-500/10 blur-3xl animate-bob" style={{ animationDelay: '-3s' }} aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Encabezado compacto, pegado al mapa */}
        <Reveal from="top">
          <div className="flex flex-col items-start gap-1.5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span
                className="inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] shadow-sm"
                style={{ color: theme.accent, borderColor: `${theme.accent}40`, backgroundColor: `${theme.accent}14` }}
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: theme.accent }} />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: theme.accent }} />
                </span>
                {enfoque.eyebrow}
              </span>
              <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {enfoque.title}
              </h2>
            </div>
            {enfoque.description && (
              <p className="max-w-3xl text-sm leading-relaxed text-slate-400">
                {enfoque.description}
              </p>
            )}
          </div>
        </Reveal>

        {/* Mapa */}
        <Reveal from="bottom" delay={120} className="mt-3">
          <div className="overflow-hidden rounded-2xl bg-slate-900/80 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/10">
            <WorldMap countries={countries} loading={loading} onSelectCountry={onSelectCountry} />
          </div>
        </Reveal>

        {/* CTA integrado */}
        <Reveal from="bottom" delay={200}>
          <div className="mt-5 flex flex-col items-center justify-between gap-2 sm:flex-row">
            {btn?.href && (
              <Link href={btn.href} className="group/cta inline-block">
                <Button
                  variant="outline"
                  size="sm"
                  style={{ color: btn.color, borderColor: btn.color }}
                  className="transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary-500/20"
                >
                  {btn.label}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover/cta:translate-x-1" aria-hidden="true" />
                </Button>
              </Link>
            )}
            <p className="flex items-center gap-2 text-caption text-slate-400">
              <MapPin className="h-4 w-4" style={{ color: theme.accent }} aria-hidden="true" />
              Clic en un país para ver sus detalles y opciones de apoyo.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────────────────────── ESPERANZA ─────────────────────────── */
function EsperanzaSection({ esperanza }: { esperanza: HomeSection }) {
  const theme = useSiteStore((s) => s.theme);
  return (
    <section
      id="esperanza"
      className="relative overflow-hidden bg-[#0d1226] py-12 text-white sm:py-16"
    >
      {/* Textura plana sutil */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        aria-hidden="true"
        style={{
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />

      {esperanza.image && esperanza.image.url && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={esperanza.image.url}
            alt={esperanza.image.alt ?? ''}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-10"
          />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[#0d1226]/80" />
        </>
      )}
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        <span
          className="mx-auto mb-5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm"
        >
          <Sunrise className="h-5 w-5 text-white" aria-hidden="true" />
        </span>
        <Quote className="mx-auto mb-4 h-6 w-6 rotate-180 text-white/70" aria-hidden="true" />
        <blockquote
          data-text={esperanza.quote}
          className="font-serif text-2xl font-medium leading-snug text-balance text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.25)] sm:text-3xl"
        >
          {esperanza.quote}
        </blockquote>
        {esperanza.cite && (
          <cite className="mt-4 block text-caption uppercase tracking-[0.25em] not-italic text-sky-200">
            {esperanza.cite}
          </cite>
        )}
        <p className="mx-auto mt-5 max-w-2xl text-body-md text-white/90">{esperanza.description}</p>
      </div>
    </section>
  );
}

/* ─────────────────────────── ARTICULOS ─────────────────────────── */
function ArticulosSection({
  articulos,
  latestArticles,
  loading,
}: {
  articulos: HomeSection;
  latestArticles: Article[];
  loading: boolean;
}) {
  const theme = useSiteStore((s) => s.theme);
  return (
    <section className="relative overflow-hidden border-y border-sky-100 bg-sky-50/60 py-24 dark:border-dark-800 dark:bg-dark-900/30">
      {/* Rejilla celeste + manchas que flotan */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 25% 25%, #0ea5e9 1px, transparent 1px), radial-gradient(circle at 75% 75%, #0ea5e9 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div aria-hidden="true" className="animate-bob absolute -left-20 top-16 h-64 w-64 rounded-full bg-sky-200/50 blur-2xl dark:bg-sky-500/10" style={{ animationDelay: '-2s' }} />
      <div aria-hidden="true" className="animate-bob absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-amber-100/60 blur-2xl dark:bg-amber-400/10" style={{ animationDelay: '-4s' }} />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-60" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal from="top">
          <div className="mx-auto max-w-3xl text-center">
            <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-primary-600 text-white shadow-lg shadow-sky-500/30 transition-transform duration-300 hover:rotate-6 hover:scale-110">
              <Newspaper className="h-7 w-7" aria-hidden="true" />
            </span>
            {articulos.eyebrow && (
              <p className="text-caption uppercase tracking-[0.25em]" style={{ color: theme.accent }}>
                {articulos.eyebrow}
              </p>
            )}
            {articulos.title && (
              <h2 className="mt-4 font-serif text-display-md font-semibold text-dark-900 dark:text-dark-100">
                {articulos.title}
              </h2>
            )}
            <div aria-hidden="true" className="mx-auto mt-5 h-1.5 w-28 rounded-full bg-gradient-to-r from-sky-500 via-amber-400 to-primary-600" />
            {articulos.description && (
              <p className="mt-5 text-body-lg text-dark-500 dark:text-dark-400">{articulos.description}</p>
            )}
          </div>
        </Reveal>

        <div className="mt-16 grid gap-3 md:gap-6 md:grid-cols-2 xl:grid-cols-3">
          {loading && latestArticles.length === 0
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton variant="rectangular" className="aspect-[16/9]" />
                  <Skeleton variant="text" width="3/4" />
                  <Skeleton variant="text" width="1/2" />
                </div>
              ))
            : latestArticles.length === 0
            ? (
                <div className="md:col-span-2 xl:col-span-3 rounded-xl border border-dashed border-dark-300 px-8 py-12 text-center dark:border-dark-600">
                  <Newspaper className="mx-auto mb-3 h-8 w-8 text-dark-300 dark:text-dark-600" aria-hidden="true" />
                  <p className="text-body-md text-dark-500 dark:text-dark-400">
                    Aún no hay artículos publicados. Cuando el equipo publique contenido, aparecerá aquí.
                  </p>
                </div>
              )
            : latestArticles.map((article, i) => (
                <Reveal key={article.id} from="bottom" delay={i * 110}>
                  <ArticleCard article={article} compact />
                </Reveal>
              ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/articulos" className="inline-block transition-transform duration-200 hover:-translate-y-0.5">
            <Button size="lg" variant="outline" className="group">
              Ver todos los artículos
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── EDUCACIÓN ─────────────────────────── */
function EducacionSection({ educacion }: { educacion: HomeSection }) {
  const theme = useSiteStore((s) => s.theme);
  const btn = educacion.buttons?.[0];

  const quoteGradient =
    educacion.image?.url === undefined
      ? `linear-gradient(135deg, #0ea5e9 0%, ${theme.primary} 55%, ${theme.primaryDark} 100%)`
      : `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`;

  return (
    <section className="relative overflow-hidden border-y border-dark-800 bg-dark-950 py-24 text-white dark:border-dark-800" style={{ backgroundColor: theme.darkSectionBg }}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 25% 25%, #0ea5e9 1px, transparent 1px), radial-gradient(circle at 75% 75%, #0ea5e9 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div aria-hidden="true" className="animate-bob absolute -left-24 top-10 h-60 w-60 rounded-full bg-sky-500/20 blur-2xl dark:bg-sky-500/10" style={{ animationDelay: '-3s' }} />
      <div aria-hidden="true" className="animate-bob absolute -right-20 bottom-8 h-64 w-64 rounded-full bg-primary-500/20 blur-2xl dark:bg-primary-500/10" style={{ animationDelay: '-1s' }} />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Reveal from="left">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-4 py-1.5 text-caption font-bold uppercase tracking-[0.2em] text-white shadow-md shadow-primary-600/30">
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                {educacion.eyebrow}
              </span>
              <h2 className="mt-5 font-serif text-display-md font-semibold text-white">
                {educacion.title}
              </h2>
              <div aria-hidden="true" className="mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-sky-500 to-primary-600" />
              <p className="mt-6 text-body-lg text-dark-300 dark:text-dark-400">{educacion.description}</p>
              {educacion.items && educacion.items.length > 0 && (
                <ul className="mt-8 space-y-4 text-body-md text-dark-200 dark:text-dark-300">
                  {educacion.items.map((li, i) => (
                    <li
                      key={li}
                      className="group flex items-start gap-3 rounded-xl border border-transparent px-3 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-400/40 hover:bg-white/5 hover:shadow-md hover:shadow-sky-950/40 dark:hover:border-sky-500/30 dark:hover:bg-dark-800/60"
                    >
                      <span
                        className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white shadow-sm shadow-primary-600/30 transition-transform duration-200 group-hover:scale-110"
                        aria-hidden="true"
                      >
                        {i + 1}
                      </span>
                      {li}
                    </li>
                  ))}
                </ul>
              )}
              {btn?.href && (
                <BounceOnView className="mt-10">
                  <Link href={btn.href} className="inline-block transition-transform duration-200 hover:-translate-y-0.5 hover:scale-[1.02]">
                    <Button size="lg" style={{ backgroundColor: btn.color ?? theme.primary }} className="group shadow-lg shadow-primary-950/40">
                      {btn.label}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                    </Button>
                  </Link>
                </BounceOnView>
              )}
            </Reveal>
          </div>

          <Reveal from="right" delay={120}>
            {educacion.image && educacion.image.url ? (
              <div className="relative">
                <div aria-hidden="true" className="animate-bob absolute -inset-2 rounded-3xl bg-gradient-to-br from-sky-400 via-amber-300 to-primary-500 opacity-50 blur-xl" />
                <img
                  src={educacion.image.url}
                  alt={educacion.image.alt ?? ''}
                  className="relative h-full w-full rounded-2xl object-cover shadow-xl"
                />
              </div>
            ) : (
              <Card
                padding="lg"
                className="relative overflow-hidden text-white shadow-xl transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl"
                style={{ background: quoteGradient }}
              >
                <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-xl" />
                <div aria-hidden="true" className="pointer-events-none absolute -bottom-14 -left-8 h-44 w-44 rounded-full bg-black/10 blur-xl" />
                <Globe2 className="mb-6 h-10 w-10 opacity-90" style={{ color: '#f9c075' }} aria-hidden="true" />
                <p className="font-serif text-heading-xl font-medium leading-snug">{educacion.quote}</p>
                <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-caption font-semibold uppercase tracking-[0.25em] backdrop-blur-md">
                  <Quote className="h-3.5 w-3.5" aria-hidden="true" />
                  {educacion.cite}
                </p>
              </Card>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── DONACIÓN ─────────────────────────── */
function DonacionSection({
  donacion,
  openDonationModal,
}: {
  donacion: HomeSection;
  openDonationModal: (id?: string) => void;
}) {
  const theme = useSiteStore((s) => s.theme);
  const fetchPublishedArticles = useAppStore((s) => s.fetchPublishedArticles);
  const [prayerArticles, setPrayerArticles] = React.useState<Article[]>([]);

  const btns: SectionButton[] =
    donacion.buttons && donacion.buttons.length > 0
      ? donacion.buttons
      : [
          { label: 'Orando', color: '#1e3a8a', href: '/articulos?categoria=oraciones' },
          { label: 'Donando', color: '#1e3a8a' },
        ];

  const needsLookup = btns.some((b) => b.articleId);

  React.useEffect(() => {
    if (!needsLookup) return;
    let active = true;
    fetchPublishedArticles()
      .then((list) => {
        if (active) setPrayerArticles(list);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [needsLookup, fetchPublishedArticles]);

  const lookupSlug = (articleId?: string): string | undefined =>
    prayerArticles.find((a) => a.id === articleId)?.slug;

  const renderButton = (btn: SectionButton, i: number) => {
    const style = { backgroundColor: btn.color || theme.primary };
    const linkClass =
      'inline-flex items-center justify-center gap-2 rounded-lg px-7 py-3.5 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30';
    const articleSlug = lookupSlug(btn.articleId);
    if (btn.articleId && articleSlug) {
      return (
        <Link key={i} href={`/articulos/${articleSlug}`} className={linkClass} style={style}>
          {btn.label}
        </Link>
      );
    }
    if (btn.articleId) {
      return (
        <Link key={i} href="/articulos" className={linkClass} style={style}>
          {btn.label}
        </Link>
      );
    }
    if (btn.href) {
      return (
        <Link key={i} href={btn.href} className={linkClass} style={style}>
          {btn.label}
        </Link>
      );
    }
    return (
      <button key={i} type="button" className={linkClass} style={style} onClick={() => openDonationModal()}>
        {btn.label}
      </button>
    );
  };

  return (
    <section className="relative overflow-hidden border-t border-dark-100 bg-dark-50 py-20 dark:border-dark-800 dark:bg-dark-900/40">
      {donacion.image && donacion.image.url && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={donacion.image.url}
            alt={donacion.image.alt ?? ''}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-15"
          />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-white/70 dark:bg-dark-900/70" />
        </>
      )}
      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-4 text-center sm:px-6">
        <HeartHandshake className="mb-6 h-10 w-10" style={{ color: theme.primary }} aria-hidden="true" />
        <h2 className="font-serif text-display-sm font-semibold text-dark-900 dark:text-dark-100">{donacion.title}</h2>
        <p className="mt-4 max-w-xl text-body-lg text-dark-500 dark:text-dark-400">{donacion.description}</p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          {btns.map(renderButton)}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── SHARED ─────────────────────────── */
function SectionHeading({
  eyebrow,
  title,
  description,
  accent,
  font = 'serif',
  titleClassName,
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
  accent: string;
  font?: 'serif' | 'sans';
  titleClassName?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow && (
        <p className="text-caption uppercase tracking-[0.25em]" style={{ color: accent }}>{eyebrow}</p>
      )}
      {title && (
        <h2
          className={
            titleClassName
              ? `mt-4 text-display-md font-semibold ${titleClassName}`
              : `mt-4 text-display-md font-semibold ${font === 'sans' ? 'font-sans tracking-tight' : 'font-serif'} text-dark-900 dark:text-dark-100`
          }
        >
          {title}
        </h2>
      )}
      {description && (
        <p className="mt-5 text-body-lg text-dark-500 dark:text-dark-400">{description}</p>
      )}
    </div>
  );
}

/* ─────────────────────────── BOTÓN FLOTANTE DONAR ─────────────────────────── */
function BounceOnView({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [bounce, setBounce] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          setBounce(false);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => setBounce(true));
          });
          timer = setTimeout(() => setBounce(false), 1200);
        });
      },
      { threshold: 0.45 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <div ref={ref} className={cn(className, bounce && 'animate-btn-bounce')}>
      {children}
    </div>
  );
}

function shade(hex: string, pct: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return hex;
  const r = Math.min(255, Math.max(0, Math.round(((n >> 16) & 255) * (1 + pct))));
  const g = Math.min(255, Math.max(0, Math.round(((n >> 8) & 255) * (1 + pct))));
  const b = Math.min(255, Math.max(0, Math.round((n & 255) * (1 + pct))));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function FloatingDonateButton({
  label,
  color,
  onClick,
}: {
  label: string;
  color?: string;
  onClick: () => void;
}) {
  const base = color || '#3b98ff';
  const light = shade(base, 0.45);
  const dark = shade(base, -0.18);
  return (
    <HeartBurst className="fixed right-6 bottom-6 z-50" auto={8000}>
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-2.5 rounded-full border border-white px-7 py-3.5 text-lg font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
        style={{
          background: `linear-gradient(135deg, ${light} 0%, ${base} 55%, ${dark} 100%)`,
          boxShadow: `0 14px 30px -8px ${base}99, 0 4px 10px -2px rgba(0,0,0,0.3)`,
        }}
        aria-label={label}
      >
        <HeartHandshake className="h-5 w-5" aria-hidden="true" />
        {label}
      </button>
    </HeartBurst>
  );
}
