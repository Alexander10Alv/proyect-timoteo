'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSiteStore } from '@/store/siteStore';
import { Reveal } from '@/components/effects/Reveal';
import { Card } from '@/components/ui';
import {
  ArrowRight,
  BookOpen,
  Church,
  Compass,
  Globe2,
  Heart,
  HeartHandshake,
  MapPinned,
  Quote,
  Sparkles,
  Telescope,
} from 'lucide-react';
import type { HomeSection } from '@/lib/siteConfig';

const PX = (id: number, w = 1200) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

const HERO_IMG = PX(13101376, 1600);
const IMG_MISION = PX(34623024);
const IMG_VISION = PX(207896);
const IMG_ENFOQUE = PX(13602798);
const IMG_ESPERANZA = PX(35120753);
const IMG_CTA = PX(12560346);

function SectionHeading({
  eyebrow,
  title,
  description,
  accent,
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
  accent: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow && <p className="text-caption uppercase tracking-[0.25em]" style={{ color: accent }}>{eyebrow}</p>}
      {title && (
        <h2 className="mt-4 font-serif text-display-md font-semibold text-dark-900 dark:text-dark-100">{title}</h2>
      )}
      {description && <p className="mt-5 text-body-lg text-dark-500 dark:text-dark-400">{description}</p>}
    </div>
  );
}

const DOCTRINE_ARTICLES = [
  {
    title: 'Escritura suficiente',
    text: 'La Biblia es nuestra autoridad final: de ella nace toda estrategia misionera.',
    color: '#0ea5e9',
  },
  {
    title: 'Iglesia centrada',
    text: 'Toda misión busca iglesias locales sanas que adoran y multiplican discípulos.',
    color: '#f43f5e',
  },
  {
    title: 'Evangelio soberano',
    text: 'Salvación por gracia, obra de Dios que alcanza a todo pueblo, lengua y nación.',
    color: '#10b981',
  },
];

export default function NosotrosPage() {
  const siteName = useSiteStore((s) => s.siteName);
  const theme = useSiteStore((s) => s.theme);
  const sections = useSiteStore((s) => s.sections);
  const doctrina = sections.doctrina ?? {};
  const enfoque = sections.enfoque ?? {};
  const esperanza = sections.esperanza ?? {};

  const mvvCards = doctrina.cards ?? [];
  const featured = mvvCards[0];
  const rest = mvvCards.slice(1);
  const mvvIcons = [Globe2, Telescope, HeartHandshake];
  const mvvColors = [
    'linear-gradient(180deg, rgba(6,78,59,0.35), rgba(4,120,87,0.92))',
    'linear-gradient(135deg, #f59e0b, #ea580c)',
    'linear-gradient(135deg, #8b5cf6, #7c3aed)',
  ];
  const enfoqueBtn = enfoque.buttons?.[0];

  return (
    <>
      {/* ───────── HERO ───────── */}
      <section className="relative overflow-hidden bg-dark-950 text-white">
        <div aria-hidden="true" className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HERO_IMG}
            alt=""
            className="h-full w-full scale-105 object-cover animate-kenburns"
            loading="eager"
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, rgba(11,10,16,0.55) 0%, rgba(15,20,35,0.92) 100%)' }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full opacity-20 blur-3xl"
            style={{ background: theme.accent }}
          />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <Reveal from="bottom">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-caption font-semibold uppercase tracking-[0.2em] text-white/90 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
              {siteName}
            </div>
            <h1 className="mt-5 font-serif text-display-xl font-semibold text-white">
              {doctrina.title ?? 'Misión, Visión y Valores'}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-body-lg text-white/85">
              {doctrina.description ??
                'Plataforma que forma y envía obreros a los pueblos que aún no han oído el evangelio.'}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/donar"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-8 py-3.5 text-lg font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 hover:shadow-emerald-400/40"
              >
                <Heart className="h-5 w-5" aria-hidden="true" />
                Donar ahora
              </Link>
              <Link
                href="/paises"
                className="group inline-flex items-center gap-2 rounded-full border-2 border-white/40 px-8 py-3.5 text-lg font-semibold text-white transition hover:border-white/80 hover:bg-white/10"
              >
                Ver los países
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────── MISIÓN / VISIÓN / VALORES ───────── */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Nuestro llamado"
          title="Misión, Visión y Valores"
          description="Todo nace de un propósito eterno: que Cristo sea conocido entre todas las naciones."
          accent="#059669"
        />
        <div className="mt-8 grid gap-5 lg:grid-cols-12">
          {featured ? (
            <Reveal from="left" className="lg:col-span-7">
              <div className="group relative h-full min-h-[300px] overflow-hidden rounded-2xl shadow-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={IMG_MISION}
                  alt={featured.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0" style={{ background: mvvColors[0] }} />
                <span aria-hidden="true" className="absolute -bottom-12 right-14 h-32 w-32 rounded-full border border-white/20" />
                <div className="relative flex h-full flex-col justify-between p-6 sm:p-7">
                  <div className="flex items-center gap-2 text-caption font-semibold uppercase tracking-[0.2em] text-white/80">
                    <Globe2 className="h-4 w-4" aria-hidden="true" />
                    01 · {siteName}
                  </div>
                  <div className="mt-3">
                    <h3 className="font-serif text-heading-lg font-semibold text-white">{featured.title}</h3>
                    <p className="mt-2 max-w-md text-body-md leading-relaxed text-white/90">{featured.text}</p>
                  </div>
                  <div aria-hidden="true" className="relative mt-4 h-1.5 w-14 rounded-full bg-white/30" />
                </div>
              </div>
            </Reveal>
          ) : null}
          {rest.length > 0 ? (
            <div className="grid gap-5 lg:col-span-5">
              {rest.map((item, i) => {
                const Icon = mvvIcons[(i % mvvIcons.length) + 1] ?? Telescope;
                const withImg = i === 0;
                return (
                  <Reveal key={item.title} from="right" delay={i * 150}>
                    <div
                      className={`group relative h-full overflow-hidden rounded-2xl p-6 text-white shadow-lg transition-transform hover:-translate-y-1.5 hover:shadow-2xl ${
                        withImg ? 'min-h-[180px]' : ''
                      }`}
                      style={withImg ? undefined : { background: mvvColors[i + 1] }}
                    >
                      {withImg ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={IMG_VISION}
                            alt={item.title}
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                            loading="lazy"
                          />
                          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(180,80,20,0.35), rgba(234,88,12,0.9))' }} />
                        </>
                      ) : null}
                      <div className="relative">
                        <div className="flex items-center gap-4">
                          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                            <Icon className="h-5 w-5 text-white" strokeWidth={2.2} aria-hidden="true" />
                          </span>
                          <div>
                            <p className="text-caption font-semibold uppercase tracking-[0.2em] text-white/70">0{i + 2}</p>
                            <h3 className="mt-1 font-serif text-heading-lg font-semibold text-white">{item.title}</h3>
                          </div>
                        </div>
                        <p className="mt-3 text-body-md leading-relaxed text-white/90">{item.text}</p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>

      {/* ───────── DOCTRINA ───────── */}
      <section className="border-y border-dark-100 bg-dark-50 py-14 dark:border-dark-800 dark:bg-dark-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Creemos"
            title="Nuestra doctrina"
            description="Convicciones bíblicas que sostienen toda nuestra misión."
            accent="#7c3aed"
          />
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {DOCTRINE_ARTICLES.map((item, i) => {
              const icons = [BookOpen, Church, Compass];
              const Icon = icons[i % icons.length];
              return (
                <Reveal key={item.title} from="bottom" delay={i * 150}>
                  <Card
                    variant="outlined"
                    padding="md"
                    className="group h-full overflow-hidden text-center transition-all hover:-translate-y-1.5 hover:shadow-xl"
                  >
                    <div aria-hidden="true" className="mx-auto mb-5 h-1.5 w-14 rounded-full" style={{ background: item.color }} />
                    <span
                      className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                      style={{ backgroundColor: `${item.color}1a` }}
                    >
                      <Icon className="h-6 w-6" style={{ color: item.color }} aria-hidden="true" />
                    </span>
                    <h3 className="font-serif text-heading-lg font-semibold text-dark-950 dark:text-dark-50">{item.title}</h3>
                    <p className="mt-3 text-body-md text-dark-700 dark:text-dark-300">{item.text}</p>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────── ENFOQUE ───────── */}
      {enfoque.title || enfoque.description ? (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <Reveal from="left">
              <p className="text-caption uppercase tracking-[0.25em]" style={{ color: '#d97706' }}>
                {enfoque.eyebrow ?? 'Nuestro Enfoque'}
              </p>
              <h2 className="mt-4 font-serif text-display-md font-semibold text-dark-900 dark:text-dark-100">
                {enfoque.title ?? 'Un mapa vivo de la gran comisión'}
              </h2>
              <p className="mt-5 text-body-lg text-dark-500 dark:text-dark-400">
                {enfoque.description ??
                  'Mapa de los países donde trabajamos: cada nodo muestra el avance del evangelio entre los pueblos no alcanzados.'}
              </p>
              {enfoqueBtn?.href && (
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href={enfoqueBtn.href}
                    className="group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-lg font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:opacity-90"
                    style={{ backgroundColor: enfoqueBtn.color || theme.primary }}
                  >
                    {enfoqueBtn.label ?? 'Ver países'}
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                </div>
              )}
            </Reveal>
            <Reveal from="right" delay={150}>
              <div className="group relative overflow-hidden rounded-2xl bg-dark-950 shadow-xl">
                <div className="flex h-[260px] items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={IMG_ENFOQUE}
                    alt={enfoque.title ?? 'Mapa de los países'}
                    className="absolute inset-0 h-full w-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(23,37,84,0.55), rgba(11,10,16,0.85))' }} />
                  <div className="relative inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm animate-float-slow">
                    <MapPinned className="h-10 w-10 text-amber-300" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* ───────── ESPERANZA ───────── */}
      {esperanza.quote ? (
        <section className="relative overflow-hidden bg-dark-950 py-16 text-white">
          <div aria-hidden="true" className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={IMG_ESPERANZA}
              alt=""
              className="h-full w-full object-cover opacity-40"
              loading="lazy"
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(11,10,16,0.9), rgba(15,23,42,0.75))' }} />
          </div>
          <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
            <Reveal from="bottom">
              <Quote className="mx-auto h-10 w-10 text-emerald-300/80" aria-hidden="true" />
              <blockquote className="mt-6 font-serif text-display-sm font-medium leading-snug text-white">
                {esperanza.quote}
              </blockquote>
              {esperanza.cite && (
                <p className="mt-6 text-caption uppercase tracking-[0.25em] text-amber-300/90">{esperanza.cite}</p>
              )}
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* ───────── CTA FINAL ───────── */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <Reveal from="bottom">
          <div className="relative overflow-hidden rounded-3xl px-8 py-12 text-center text-white shadow-2xl sm:px-12">
            <div aria-hidden="true" className="absolute inset-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMG_CTA}
                alt=""
                className="h-full w-full object-cover transition-transform duration-[2000ms] hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(120deg, rgba(124,58,237,0.85), rgba(219,39,119,0.75))' }} />
            </div>
            <h2 className="relative font-serif text-display-md font-semibold text-white">
              Únete a esta misión
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-body-lg text-white/90">
              Ora, explora los pueblos no alcanzados o participa en la formación de nuevos obreros.
            </p>
            <div className="relative mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/donar"
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-semibold text-dark-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-dark-50"
              >
                <Heart className="h-5 w-5 text-rose-500" aria-hidden="true" />
                Donar ahora
              </Link>
              <Link
                href="/paises"
                className="group inline-flex items-center gap-2 rounded-full border-2 border-white/50 px-8 py-4 text-lg font-semibold text-white transition hover:border-white hover:bg-white/10"
              >
                Explorar países
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}