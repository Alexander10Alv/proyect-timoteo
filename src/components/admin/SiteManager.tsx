'use client';

import * as React from 'react';
import { useSiteStore } from '@/store/siteStore';
import { useAppStore } from '@/store';
import { Button, Card } from '@/components/ui';
import type { Article } from '@/types';
import type { HomeSection, HomeSlide, HomeSlideMedia, SectionButton, SectionCard, SectionImage, SectionVideo, SlideLink } from '@/lib/siteConfig';
import { compressVideoIfNeeded } from '@/lib/videoCompress';
import { cn, getPostTypeLabel } from '@/lib/utils';
import {
  Palette,
  Type,
  Send,
  Check,
  Globe,
  Loader2,
  Image as ImageIcon,
  Video as VideoIcon,
  Plus,
  Trash2,
  List,
  Link as LinkIcon,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  AlignLeft,
  AlignCenter,
} from 'lucide-react';

const SECTION_KEYS: Array<{ key: string; label: string }> = [
  { key: 'hero', label: 'Inicio (Hero)' },
  { key: 'doctrina', label: 'Nosotros' },
  { key: 'misioneros', label: 'Misioneros' },
  { key: 'enfoque', label: 'Enfoque / Mapa' },
  { key: 'esperanza', label: 'Esperanza' },
  { key: 'articulos', label: 'Artículos' },
  { key: 'educacion', label: 'Eventos' },
  { key: 'educacionHero', label: 'Hero Eventos' },
  { key: 'donacion', label: 'Donación' },
];

const IMAGE_POSITIONS: Array<{ value: NonNullable<SectionImage['position']>; label: string }> = [
  { value: 'bg', label: 'Fondo de la sección' },
  { value: 'left', label: 'Izquierda' },
  { value: 'right', label: 'Derecha' },
];

export function SiteManager() {
  const site = useSiteStore();
  const [siteName, setSiteName] = React.useState(site.siteName);
  const [theme, setTheme] = React.useState({ ...site.theme });
  const [footer, setFooter] = React.useState({ ...site.footer });
  const [sections, setSections] = React.useState<Record<string, HomeSection>>(() =>
    Object.fromEntries(Object.entries(site.sections).map(([k, v]) => [k, deepClone(v)]))
  );
  const [activeKey, setActiveKey] = React.useState<string>('hero');
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState('');

  const setSection = (key: string, updater: (s: HomeSection) => HomeSection) => {
    setSections((prev) => ({ ...prev, [key]: updater(prev[key] ?? {}) }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/site', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteName,
          theme,
          footer,
          home: sections,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? 'No se pudo guardar la configuración.');
      }
      site.apply({ siteName, theme, footer, sections });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const sec = sections[activeKey] ?? {};

  return (
    <div className="space-y-10">
      {/* Identidad */}
      <Card padding="lg">
        <CardTitle icon={Globe} title="Identidad del sitio" desc="Nombre que aparece en la barra, logo y pie de página." />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Nombre de la plataforma">
            <TextInput value={siteName} onChange={setSiteName} placeholder="Proyecto Timoteo" />
          </Field>
        </div>
      </Card>

      {/* Tema */}
      <Card padding="lg">
        <CardTitle icon={Palette} title="Tema de colores" desc="Se aplican en todo el inicio (botones, acentos, secciones oscuras)." />
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ColorField label="Color principal" value={theme.primary} onChange={(v) => setTheme((t) => ({ ...t, primary: v }))} />
          <ColorField label="Principal oscuro" value={theme.primaryDark} onChange={(v) => setTheme((t) => ({ ...t, primaryDark: v }))} />
          <ColorField label="Acento (títulos)" value={theme.accent} onChange={(v) => setTheme((t) => ({ ...t, accent: v }))} />
          <ColorField label="Fondo hero" value={theme.heroBg} onChange={(v) => setTheme((t) => ({ ...t, heroBg: v }))} />
          <ColorField label="Fondo sección oscura" value={theme.darkSectionBg} onChange={(v) => setTheme((t) => ({ ...t, darkSectionBg: v }))} />
          <ColorField label="Botón flotante de donar" value={theme.floatingDonarColor ?? ''} placeholder="#3b98ff (usa el del tema)" onChange={(v) => setTheme((t) => ({ ...t, floatingDonarColor: v }))} />
        </div>
      </Card>

      {/* Footer */}
      <Card padding="lg">
        <CardTitle icon={Type} title="Pie de página" desc="Texto de bienvenida/descripción del sitio." />
        <div className="mt-5 space-y-4">
          <Field label="Descripción / tagline">
            <TextArea value={footer.tagline} onChange={(v) => setFooter((f) => ({ ...f, tagline: v }))} rows={3} />
          </Field>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={footer.showNewsletter}
              onChange={(e) => setFooter((f) => ({ ...f, showNewsletter: e.target.checked }))}
              className="h-4 w-4 accent-primary-600"
            />
            <span className="text-body-sm text-dark-700 dark:text-dark-300">Mostrar formulario de boletín</span>
          </label>
        </div>
      </Card>

      {/* Contenido por sección */}
      <Card padding="lg">
        <CardTitle icon={Type} title="Contenido por sección" desc="Edita los textos, botones, listas, imágenes y estadísticas de cada bloque." />

        <div className="mt-5 flex flex-wrap gap-2">
          {SECTION_KEYS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveKey(key)}
              className={
                activeKey === key
                  ? 'rounded-lg bg-primary-600 px-4 py-2 text-body-sm font-medium text-white'
                  : 'rounded-lg border border-dark-300 px-4 py-2 text-body-sm font-medium text-dark-700 hover:bg-dark-100 dark:border-dark-600 dark:text-dark-300 dark:hover:bg-dark-800'
              }
            >
              {label}
            </button>
          ))}
        </div>

        <SectionEditor
          key={activeKey}
          section={sec}
          isHero={activeKey === 'hero'}
          isMisioneros={activeKey === 'misioneros'}
          isEducacionHero={activeKey === 'educacionHero'}
          hideImage={activeKey === 'enfoque'}
          buttonsCategory={activeKey === 'donacion' ? 'oraciones' : undefined}
          themeAccent={theme.accent}
          onChange={(next) => setSection(activeKey, () => next)}
        />
      </Card>

      {/* Acciones */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Guardar cambios
        </Button>
        {saved && (
          <span className="inline-flex items-center gap-2 text-body-sm font-medium text-green-600 dark:text-green-400">
            <Check className="h-4 w-4" /> Guardado. Recarga el inicio para ver los cambios.
          </span>
        )}
        {error && <span className="text-body-sm font-medium text-red-500">{error}</span>}
      </div>
    </div>
  );
}

/* ─────────── Editor de una sección ─────────── */
function SectionEditor({
  section,
  isHero,
  isMisioneros,
  isEducacionHero,
  hideImage,
  buttonsCategory,
  themeAccent,
  onChange,
}: {
  section: HomeSection;
  isHero: boolean;
  isMisioneros: boolean;
  isEducacionHero: boolean;
  hideImage: boolean;
  /** Si se pasa (slug de categoría), los botones solo pueden apuntar a artículos de esa categoría. */
  buttonsCategory?: string;
  themeAccent: string;
  onChange: (next: HomeSection) => void;
}) {
  const set = (patch: Partial<HomeSection>) => onChange({ ...section, ...patch });

  if (isHero) {
    return (
      <div className="mt-6 space-y-8">
        <SlidesEditor
          slides={section.slides ?? []}
          themeAccent={themeAccent}
          onChange={(slides) => set({ slides })}
        />
      </div>
    );
  }

  if (isEducacionHero) {
    return (
      <div className="mt-6 space-y-8">
        <EducacionHeroEditor section={section} onChange={set} />
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-8">
      {/* Imagen de la sección / selector de misioneros */}
      {isMisioneros ? (
        <>
          <MissionariesPicker
            ids={section.missionaryIds ?? []}
            onChange={(ids) => set({ missionaryIds: ids })}
          />
          <SectionVideoEditor
            video={section.video ?? null}
            onChange={(video) => set({ video })}
            title="Video de fondo (sección Misioneros del Inicio)"
            hint="MP4 corto (máx. 65 MB). Reemplaza el cielo anime y las nubes como fondo de la sección Misioneros en la página de inicio. Si lo dejas vacío se muestra el cielo anime."
          />
          <SectionVideoEditor
            video={section.heroVideo ?? null}
            onChange={(heroVideo) => set({ heroVideo })}
            title="Video de fondo (hero de /misioneros)"
            hint="MP4 corto (máx. 65 MB). Se reproduce como fondo de la cabecera de la página /misioneros. Si lo dejas vacío se muestra el fondo oscuro por defecto."
          />
        </>
      ) : hideImage ? null : (
        <ImageEditor
          image={section.image ?? null}
          themeAccent={themeAccent}
          onChange={(image) => set({ image })}
        />
      )}

      {/* Textos base */}
      <div className="grid gap-5 lg:grid-cols-2">
      <Field label="Eyebrow (texto pequeño superior)">
          <TextInput value={section.eyebrow ?? ''} onChange={(v) => set({ eyebrow: v })} />
        </Field>
        <Field label="Título">
          <TextInput value={section.title ?? ''} onChange={(v) => set({ title: v })} />
        </Field>
        <Field label="Palabra destacada (solo hero)">
          <TextInput value={section.highlight ?? ''} onChange={(v) => set({ highlight: v })} />
        </Field>
        <Field label="Descripción">
          <TextArea value={section.description ?? ''} onChange={(v) => set({ description: v })} rows={3} />
        </Field>
        <div className="lg:col-span-2">
          <Field label="Cita bíblica (secciones con versículo)">
            <TextArea value={section.quote ?? ''} onChange={(v) => set({ quote: v })} rows={2} />
          </Field>
        </div>
        <Field label="Referencia de la cita (p. ej. Isaías 6 : 8)">
          <TextInput value={section.cite ?? ''} onChange={(v) => set({ cite: v })} />
        </Field>
      </div>

      {/* Botones */}
      <ButtonsEditor
        buttons={section.buttons ?? []}
        themeAccent={themeAccent}
        categorySlug={buttonsCategory}
        onChange={(buttons) => set({ buttons })}
      />

      {/* Items (lista de textos) */}
      <ItemsEditor items={section.items ?? []} onChange={(items) => set({ items })} />

      {/* Cards (título + texto) */}
      <CardsEditor cards={section.cards ?? []} onChange={(cards) => set({ cards })} />

      {/* Stats */}
      <StatsEditor stats={section.stats ?? []} onChange={(stats) => set({ stats })} />
    </div>
  );
}

/* ─────────── Selector de misioneros (carrusel, máx. 4) ─────────── */
function MissionariesPicker({ ids, onChange }: { ids: number[]; onChange: (ids: number[]) => void }) {
  const missionaries = useAppStore((s) => s.missionaries);
  const fetchMissionaries = useAppStore((s) => s.fetchMissionaries);

  React.useEffect(() => {
    if (missionaries.length === 0) void fetchMissionaries();
  }, [missionaries.length, fetchMissionaries]);

  const toggle = (id: number) => {
    if (ids.includes(id)) {
      onChange(ids.filter((x) => x !== id));
    } else {
      if (ids.length >= 4) return;
      onChange([...ids, id]);
    }
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-body-sm font-medium text-dark-700 dark:text-dark-300">
          Misioneros en el carrusel (máximo 4)
        </p>
        <span className="text-body-sm font-semibold" style={{ color: ids.length >= 4 ? 'rgb(220 38 38)' : 'rgb(100 116 139)' }}>
          {ids.length}/4
        </span>
      </div>
      {ids.length >= 4 && (
        <p className="mb-3 text-body-sm text-red-500">
          Ya elegiste 4. Desmarca uno para agregar otro.
        </p>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        {missionaries.map((m) => {
          const active = ids.includes(m.id);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => toggle(m.id)}
              disabled={!active && ids.length >= 4}
              className={
                active
                  ? 'flex items-center gap-3 rounded-xl border-2 p-2.5 text-left'
                  : 'flex items-center gap-3 rounded-xl border border-dark-300 p-2.5 text-left hover:bg-dark-100 disabled:opacity-40 dark:border-dark-600 dark:hover:bg-dark-800'
              }
              style={active ? { borderColor: '#7c3aed', backgroundColor: '#7c3aed1a' } : undefined}
            >
              {m.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.photoUrl} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
              ) : (
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-100 font-serif text-heading-md font-semibold text-primary-700 dark:bg-primary-500/20 dark:text-primary-300">
                  {m.name.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate text-body-sm font-medium text-dark-900 dark:text-dark-100">{m.name}</span>
                <span className="block truncate text-caption text-dark-500 dark:text-dark-400">
                  {m.role ?? (m.countryName ? m.countryName : 'Misionero')}
                </span>
              </span>
              <span
                className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
                style={{
                  borderColor: active ? '#7c3aed' : 'rgb(148 163 184)',
                  backgroundColor: active ? '#7c3aed' : 'transparent',
                }}
                aria-hidden="true"
              >
                {active && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>
      {missionaries.length === 0 && (
        <p className="mt-2 text-body-sm text-dark-500 dark:text-dark-400">
          No hay misioneros activos. Agrégalos en el panel de Misioneros.
        </p>
      )}
      <p className="mt-3 text-caption text-dark-400 dark:text-dark-500">
        Si no eliges ninguno, se muestran por defecto los 4 misioneros más recientes con foto.
      </p>
    </div>
  );
}

/* ─────────── Imagen ─────────── */
function ImageEditor({
  image,
  themeAccent,
  onChange,
}: {
  image: SectionImage | null;
  themeAccent: string;
  onChange: (image: SectionImage | null) => void;
}) {
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState('');
  const fileRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError('');
    const fd = new FormData();
    fd.append('file', file);
    setUploading(true);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? 'Error al subir la imagen.');
      }
      const data = (await res.json()) as { url: string };
      onChange({ url: data.url, alt: '', position: image?.position ?? 'right' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir la imagen.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="rounded-lg border border-dashed border-dark-300 p-4 dark:border-dark-600">
      <div className="mb-3 flex items-center gap-2">
        <ImageIcon className="h-4 w-4 text-primary-600 dark:text-primary-300" aria-hidden="true" />
        <h4 className="text-body-sm font-semibold text-dark-800 dark:text-dark-200">Imagen de la sección</h4>
      </div>

      {image ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.url} alt={image.alt ?? ''} className="h-28 w-40 shrink-0 rounded-lg border border-dark-200 object-cover dark:border-dark-700" />
          <div className="flex-1 space-y-3">
            <Field label="URL de la imagen">
              <TextInput value={image.url} onChange={(v) => onChange({ ...image, url: v })} />
            </Field>
            <Field label="Texto alternativo (accesibilidad)">
              <TextInput value={image.alt ?? ''} onChange={(v) => onChange({ ...image, alt: v })} />
            </Field>
            <Field label="Posición">
              <div className="flex flex-wrap gap-2">
                {IMAGE_POSITIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange({ ...image, position: opt.value })}
                    className={
                      image.position === opt.value
                        ? 'rounded-lg bg-primary-600 px-3 py-1.5 text-body-sm font-medium text-white'
                        : 'rounded-lg border border-dark-300 px-3 py-1.5 text-body-sm font-medium text-dark-700 hover:bg-dark-100 dark:border-dark-600 dark:text-dark-300 dark:hover:bg-dark-800'
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </Field>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleFile(f);
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                Reemplazar
              </Button>
              <Button type="button" variant="ghost" size="sm" className="text-red-500" onClick={() => onChange(null)}>
                <Trash2 className="h-4 w-4" /> Quitar imagen
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Subir imagen
          </Button>
        </div>
      )}

      {error && <p className="mt-3 text-body-sm font-medium text-red-500">{error}</p>}
      {!image && themeAccent && (
        <p className="mt-3 text-caption text-dark-400 dark:text-dark-500">
          La imagen es opcional. Si no hay imagen, la sección se muestra igual que hoy.
        </p>
      )}
    </div>
  );
}

/* ─────────── Botones ─────────── */
function ButtonsEditor({
  buttons,
  themeAccent,
  categorySlug,
  onChange,
}: {
  buttons: SectionButton[];
  themeAccent: string;
  /** Si se pasa (slug de categoría), el botón elige un artículo de esa categoría dinámicamente (o el listado), sin href libre. */
  categorySlug?: string;
  onChange: (buttons: SectionButton[]) => void;
}) {
  const { articles, fetchArticles } = useAppStore();
  const [categoryArticles, setCategoryArticles] = React.useState<Article[]>([]);

  React.useEffect(() => {
    if (articles.length === 0) void fetchArticles().catch(() => undefined);
  }, [articles.length, fetchArticles]);

  React.useEffect(() => {
    if (!categorySlug) return;
    let active = true;
    fetch(`/api/articles?categoria=${encodeURIComponent(categorySlug)}&status=PUBLISHED&limit=100`)
      .then((r) => r.json())
      .then((d) => {
        if (active) setCategoryArticles(d.articles ?? []);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [categorySlug]);

  const update = (i: number, patch: Partial<SectionButton>) => {
    const next = buttons.map((b, idx) => (idx === i ? { ...b, ...patch } : b));
    onChange(next);
  };

  return (
    <EditorBlock
      icon={LinkIcon}
      title="Botones"
      hint={
        categorySlug
          ? 'El botón abre el modal de donación si no elige nada, o lleva a un artículo (o al listado) de la categoría «Oraciones».'
          : 'El botón abre el modal de donación si no tiene enlace (href). Si eliges un artículo, el botón lleva a ese artículo del muro.'
      }
    >
      {buttons.length === 0 && <p className="text-body-sm text-dark-400 dark:text-dark-500">Sin botones.</p>}
      <div className="space-y-4">
        {buttons.map((btn, i) => (
          <div key={i} className="rounded-lg border border-dark-200 p-4 dark:border-dark-700">
            <div className="flex items-start justify-between gap-3">
              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                <Field label="Texto del botón">
                  <TextInput value={btn.label} onChange={(v) => update(i, { label: v })} />
                </Field>
                {categorySlug ? (
                  <div className="sm:col-span-2">
                    <Field label={`Artículo de «${categorySlug}» (opcional)`}>
                      <select
                        value={btn.articleId ? `article:${btn.articleId}` : btn.href ? 'listado' : ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === 'listado') {
                            update(i, { articleId: undefined, href: `/articulos?categoria=${categorySlug}` });
                          } else if (v.startsWith('article:')) {
                            update(i, { articleId: v.slice(8), href: undefined });
                          } else {
                            update(i, { articleId: undefined, href: undefined });
                          }
                        }}
                        className="w-full rounded-lg border border-dark-300 bg-white px-3 py-2 text-body-md text-dark-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-dark-600 dark:bg-dark-800 dark:text-dark-100"
                      >
                        <option value="">Ninguno (abre el modal de donación)</option>
                        <option value="listado">El listado de {categorySlug} («/articulos?categoria=…»)</option>
                        {categoryArticles.length === 0 && (
                          <option value="" disabled>
                            — No hay artículos publicados en esta categoría —
                          </option>
                        )}
                        {categoryArticles.map((a) => (
                          <option key={a.id} value={`article:${a.id}`}>
                            {a.title}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                ) : (
                  <>
                    <Field label="Enlace (href, opcional)">
                      <TextInput value={btn.href ?? ''} onChange={(v) => update(i, { href: v || undefined })} placeholder="Ej: /articulos" />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Artículo destino (opcional, prioridad sobre el enlace)">
                        <select
                          value={btn.articleId ?? ''}
                          onChange={(e) => update(i, { articleId: e.target.value || undefined })}
                          className="w-full rounded-lg border border-dark-300 bg-white px-3 py-2 text-body-md text-dark-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-dark-600 dark:bg-dark-800 dark:text-dark-100"
                        >
                          <option value="">Ninguno (usa el enlace o abre la donación)</option>
                          {articles.map((a) => (
                            <option key={a.id} value={a.id}>{a.title}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </>
                )}
                <div className="sm:col-span-2">
                  <ColorField label="Color del botón" value={btn.color} onChange={(v) => update(i, { color: v })} />
                </div>
              </div>
              {buttons.length > 1 && (
                <button
                  type="button"
                  className="shrink-0 rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => onChange(buttons.filter((_, idx) => idx !== i))}
                  aria-label="Eliminar botón"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...buttons, { label: '', color: themeAccent }])}
        >
          <Plus className="h-4 w-4" /> Añadir botón
        </Button>
      </div>
    </EditorBlock>
  );
}

/* ─────────── Items (lista de textos) ─────────── */
function ItemsEditor({ items, onChange }: { items: string[]; onChange: (items: string[]) => void }) {
  const update = (i: number, value: string) => {
    const next = items.map((it, idx) => (idx === i ? value : it));
    onChange(next);
  };

  return (
    <EditorBlock icon={List} title="Lista de puntos (educación)">
      {items.length === 0 && <p className="text-body-sm text-dark-400 dark:text-dark-500">Sin puntos.</p>}
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <TextInput value={item} onChange={(v) => update(i, v)} />
            <button
              type="button"
              className="shrink-0 rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              aria-label="Eliminar punto"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, ''])}>
          <Plus className="h-4 w-4" /> Añadir punto
        </Button>
      </div>
    </EditorBlock>
  );
}

/* ─────────── Cards (título + texto, doctrina) ─────────── */
function CardsEditor({ cards, onChange }: { cards: SectionCard[]; onChange: (cards: SectionCard[]) => void }) {
  const update = (i: number, patch: Partial<SectionCard>) => {
    const next = cards.map((c, idx) => (idx === i ? { ...c, ...patch } : c));
    onChange(next);
  };

  return (
    <EditorBlock icon={ImageIcon} title="Tarjetas (doctrina)">
      {cards.length === 0 && <p className="text-body-sm text-dark-400 dark:text-dark-500">Sin tarjetas.</p>}
      <div className="space-y-4">
        {cards.map((card, i) => (
          <div key={i} className="rounded-lg border border-dark-200 p-4 dark:border-dark-700">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-3">
                <Field label={`Título ${i + 1}`}>
                  <TextInput value={card.title} onChange={(v) => update(i, { title: v })} />
                </Field>
                <Field label="Texto">
                  <TextArea value={card.text} onChange={(v) => update(i, { text: v })} rows={3} />
                </Field>
              </div>
              {cards.length > 1 && (
                <button
                  type="button"
                  className="shrink-0 rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => onChange(cards.filter((_, idx) => idx !== i))}
                  aria-label="Eliminar tarjeta"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...cards, { title: '', text: '' }])}>
          <Plus className="h-4 w-4" /> Añadir tarjeta
        </Button>
      </div>
    </EditorBlock>
  );
}

/* ─────────── Stats (valor + label, hero) ─────────── */
function StatsEditor({
  stats,
  onChange,
}: {
  stats: Array<{ value: string; label: string }>;
  onChange: (stats: Array<{ value: string; label: string }>) => void;
}) {
  const update = (i: number, patch: { value?: string; label?: string }) => {
    const next = stats.map((st, idx) => (idx === i ? { ...st, ...patch } : st));
    onChange(next);
  };

  return (
    <EditorBlock icon={List} title="Estadísticas del hero">
      {stats.length === 0 && <p className="text-body-sm text-dark-400 dark:text-dark-500">Sin estadísticas.</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {stats.map((stat, i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg border border-dark-200 p-3 dark:border-dark-700">
            <div className="grid flex-1 gap-2 sm:grid-cols-2">
              <TextInput value={stat.value} onChange={(v) => update(i, { value: v })} placeholder="Valor" />
              <TextInput value={stat.label} onChange={(v) => update(i, { label: v })} placeholder="Etiqueta" />
            </div>
            <button
              type="button"
              className="shrink-0 rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={() => onChange(stats.filter((_, idx) => idx !== i))}
              aria-label="Eliminar estadística"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...stats, { value: '', label: '' }])}
        >
          <Plus className="h-4 w-4" /> Añadir estadística
        </Button>
      </div>
    </EditorBlock>
  );
}

/* ─────────── UI helpers ─────────── */
function EditorBlock({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: React.ElementType;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-dark-50 p-4 dark:bg-dark-900/40">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary-600 dark:text-primary-300" aria-hidden="true" />
        <h4 className="text-body-sm font-semibold uppercase tracking-wide text-dark-800 dark:text-dark-200">{title}</h4>
      </div>
      {hint && <p className="mb-3 text-caption text-dark-400 dark:text-dark-500">{hint}</p>}
      {children}
    </div>
  );
}

function CardTitle({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
        <Icon className="h-5 w-5 text-primary-600 dark:text-primary-300" aria-hidden="true" />
      </span>
      <div>
        <h3 className="font-serif text-heading-lg font-semibold text-dark-900 dark:text-dark-100">{title}</h3>
        {desc && <p className="mt-1 text-body-sm text-dark-500 dark:text-dark-400">{desc}</p>}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-body-sm font-medium text-dark-700 dark:text-dark-300">{label}</span>
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-dark-300 bg-white px-3 py-2 text-body-md text-dark-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-dark-600 dark:bg-dark-800 dark:text-dark-100"
    />
  );
}

function TextArea({
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      rows={rows}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-dark-300 bg-white px-3 py-2 text-body-md text-dark-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-dark-600 dark:bg-dark-800 dark:text-dark-100"
    />
  );
}

function ColorField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-body-sm font-medium text-dark-700 dark:text-dark-300">{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="color"
          value={value || '#7c3aed'}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-dark-300 bg-transparent dark:border-dark-600"
        />
        <TextInput value={value} onChange={onChange} placeholder={placeholder} />
      </span>
    </label>
  );
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

/* ═══════════════ CARRUSEL (HERO) ═══════════════ */

const MAX_SLIDES = 4;

function SlidesEditor({
  slides,
  themeAccent,
  onChange,
}: {
  slides: HomeSlide[];
  themeAccent: string;
  onChange: (slides: HomeSlide[]) => void;
}) {
  const { courses, fetchCourses } = useAppStore();
  const { articles, fetchArticles } = useAppStore();

  React.useEffect(() => {
    if (courses.length === 0) void fetchCourses().catch(() => undefined);
    if (articles.length === 0) void fetchArticles().catch(() => undefined);
  }, [courses.length, articles.length, fetchCourses, fetchArticles]);

  const updateSlide = (index: number, patch: Partial<HomeSlide>) => {
    onChange(slides.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const addSlide = () => {
    if (slides.length >= MAX_SLIDES) return;
    onChange([
      ...slides,
      {
        title: '',
        description: '',
        image: { url: '', alt: '', position: 'bg' },
        buttonLabel: 'Más información',
        link: { type: 'url', href: '#donar' },
        align: 'left',
      },
    ]);
  };

  const removeSlide = (index: number) => {
    onChange(slides.filter((_, i) => i !== index));
  };

  const move = (index: number, dir: -1 | 1) => {
    const next = [...slides];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    onChange(next);
  };

  return (
    <EditorBlock icon={ImageIcon} title="Carrusel del Hero" hint={`Administra hasta ${MAX_SLIDES} diapositivas. Cada una tiene fondo, título, descripción y un botón que puede enlazar a un artículo, curso o URL.`}>
      <div className="mb-4 flex items-center gap-2 text-caption text-dark-500 dark:text-dark-400">
        <span>{slides.length}/{MAX_SLIDES} diapositivas</span>
      </div>

      <div className="space-y-5">
        {slides.map((slide, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center gap-1 pt-1">
              <button
                type="button"
                className="rounded p-1 text-dark-500 hover:bg-dark-200 disabled:opacity-30 dark:text-dark-400 dark:hover:bg-dark-700"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="Subir"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="rounded p-1 text-dark-500 hover:bg-dark-200 disabled:opacity-30 dark:text-dark-400 dark:hover:bg-dark-700"
                onClick={() => move(i, 1)}
                disabled={i === slides.length - 1}
                aria-label="Bajar"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 rounded-lg border border-dark-200 p-4 dark:border-dark-700">
              <div className="mb-3 flex items-center justify-between">
                <h5 className="text-body-sm font-semibold text-dark-800 dark:text-dark-200">Diapositiva {i + 1}</h5>
                <button
                  type="button"
                  onClick={() => removeSlide(i)}
                  className="shrink-0 rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  aria-label="Eliminar diapositiva"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <SlideEditor slide={slide} themeAccent={themeAccent} onChange={(patch) => updateSlide(i, patch)} />
            </div>
          </div>
        ))}

        {slides.length === 0 && (
          <p className="text-body-sm text-dark-400 dark:text-dark-500">Aún no hay diapositivas. Añade la primera para mostrar el carrusel.</p>
        )}
      </div>

      <div className="mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={addSlide}
          disabled={slides.length >= MAX_SLIDES}
        >
          <Plus className="h-4 w-4" /> Añadir diapositiva
        </Button>
      </div>

      <p className="mt-3 text-caption text-dark-400 dark:text-dark-500">
        Sugerencia: optimiza las imágenes de fondo (mismo tamaño) para que el carrusel se vea uniforme.
      </p>
    </EditorBlock>
  );
}

function SlideEditor({
  slide,
  themeAccent,
  onChange,
}: {
  slide: HomeSlide;
  themeAccent: string;
  onChange: (patch: Partial<HomeSlide>) => void;
}) {
  return (
    <div className="space-y-3">
      <SlideImagePicker image={slide.image} onChange={(image) => onChange({ image })} />

      <Field label="Alineación del contenido">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange({ align: 'left' })}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-body-sm font-medium transition-colors',
              (slide.align ?? 'left') === 'left'
                ? 'border-primary-600 bg-primary-600 text-white'
                : 'border-dark-300 text-dark-700 hover:bg-dark-100 dark:border-dark-600 dark:text-dark-300 dark:hover:bg-dark-800'
            )}
          >
            <AlignLeft className="h-4 w-4" aria-hidden="true" />
            Izquierda
          </button>
          <button
            type="button"
            onClick={() => onChange({ align: 'center' })}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-body-sm font-medium transition-colors',
              slide.align === 'center'
                ? 'border-primary-600 bg-primary-600 text-white'
                : 'border-dark-300 text-dark-700 hover:bg-dark-100 dark:border-dark-600 dark:text-dark-300 dark:hover:bg-dark-800'
            )}
          >
            <AlignCenter className="h-4 w-4" aria-hidden="true" />
            Centrar
          </button>
        </div>
      </Field>

      <Field label="Eyebrow (texto pequeño superior)">
        <TextInput value={slide.eyebrow ?? ''} onChange={(v) => onChange({ eyebrow: v })} />
      </Field>
      <Field label="Título">
        <TextInput value={slide.title} onChange={(v) => onChange({ title: v })} />
      </Field>
      <Field label="Descripción">
        <TextArea value={slide.description} onChange={(v) => onChange({ description: v })} rows={2} />
      </Field>
      <Field label="Texto del botón">
        <TextInput value={slide.buttonLabel} onChange={(v) => onChange({ buttonLabel: v })} />
      </Field>
      <Field label="Color de acento (eyebrow y palabra destacada)">
        <ColorField label="" value={slide.accent || ''} onChange={(v) => onChange({ accent: v || undefined })} placeholder="usa el del tema" />
      </Field>
      <Field label="Color del botón">
        <ColorField label="" value={slide.buttonColor || ''} onChange={(v) => onChange({ buttonColor: v || undefined })} placeholder="#7c3aed (usa el del tema)" />
      </Field>
      <Field label="¿A dónde lleva el botón?">
        <SlideLinkEditor link={slide.link} themeAccent={themeAccent} onChange={(link) => onChange({ link })} />
      </Field>
    </div>
  );
}

function SlideImagePicker({
  image,
  onChange,
}: {
  image: SectionImage;
  onChange: (image: SectionImage) => void;
}) {
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState('');
  const fileRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError('');
    const fd = new FormData();
    fd.append('file', file);
    setUploading(true);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? 'Error al subir la imagen.');
      }
      const data = (await res.json()) as { url: string };
      onChange({ ...image, url: data.url });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir la imagen.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="rounded-lg border border-dashed border-dark-300 p-3 dark:border-dark-600">
      <span className="mb-2 block text-body-sm font-medium text-dark-700 dark:text-dark-300">Imagen de fondo</span>
      {image.url ? (
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.url} alt={image.alt ?? ''} className="h-20 w-32 shrink-0 rounded border border-dark-200 object-cover dark:border-dark-700" />
          <div className="flex-1 space-y-2">
            <TextInput value={image.url} onChange={(v) => onChange({ ...image, url: v })} />
            <Field label="Texto alternativo (opcional)">
              <TextInput value={image.alt ?? ''} onChange={(v) => onChange({ ...image, alt: v })} />
            </Field>
            <div className="flex gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleFile(f);
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                Reemplazar
              </Button>
              <Button type="button" variant="ghost" size="sm" className="text-red-500" onClick={() => onChange({ ...image, url: '' })}>
                <Trash2 className="h-4 w-4" /> Quitar
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
          <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Subir imagen
          </Button>
        </div>
      )}
      {error && <p className="mt-2 text-body-sm font-medium text-red-500">{error}</p>}
    </div>
  );
}

function SectionVideoEditor({
  video,
  onChange,
  title = 'Video de fondo',
  hint,
}: {
  video: SectionVideo | null;
  onChange: (video: SectionVideo | null) => void;
  title?: string;
  hint?: string;
}) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [compressing, setCompressing] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleFile = async (f: File) => {
    setUploading(true);
    setError('');
    try {
      const file = await compressVideoIfNeeded(f, () => setCompressing(true));
      setCompressing(false);
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !data?.url) throw new Error(data?.error ?? 'Error al subir el video.');
      onChange({ url: data.url, poster: video?.poster });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el video.');
    } finally {
      setUploading(false);
      setCompressing(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <EditorBlock icon={VideoIcon} title={title} hint={hint}>
      <div className="flex items-start gap-3">
        {video?.url ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            src={video.url}
            controls
            playsInline
            className="h-28 w-48 shrink-0 rounded-lg border border-dark-200 bg-black object-cover dark:border-dark-700"
          />
        ) : (
          <div className="flex h-28 w-48 shrink-0 items-center justify-center rounded-lg border border-dashed border-dark-300 bg-dark-50 text-caption text-dark-400 dark:border-dark-600 dark:bg-dark-800">
            Sin video
          </div>
        )}
        <div className="flex-1 space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept="video/mp4,video/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
            aria-label="Subir video MP4"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" loading={uploading} onClick={() => fileRef.current?.click()}>
              {video?.url ? 'Reemplazar video' : 'Subir MP4 desde mi PC'}
            </Button>
            {video?.url && (
              <Button type="button" variant="ghost" size="sm" className="text-red-500" onClick={() => onChange(null)}>
                <Trash2 className="h-4 w-4" /> Quitar
              </Button>
            )}
          </div>
          {compressing && (
            <p className="text-body-sm font-medium text-primary-600 dark:text-primary-300">
              Comprimiendo video en tu navegador… (archivo grande, puede tardar 1-3 minutos)
            </p>
          )}
          <TextInput
            value={video?.url ?? ''}
            onChange={(v) => onChange(v ? { url: v, poster: video?.poster } : null)}
            placeholder="…o pega aquí el enlace de un video MP4 (https://…)"
          />
          {error && <p className="text-body-sm font-medium text-red-500">{error}</p>}
        </div>
      </div>
    </EditorBlock>
  );
}

function SlideLinkEditor({
  link,
  themeAccent,
  onChange,
}: {
  link: SlideLink;
  themeAccent: string;
  onChange: (link: SlideLink) => void;
}) {
  const { courses, articles } = useAppStore();

  const linkType = link.type;

  const linkTypeOptions: Array<{ value: SlideLink['type']; label: string }> = [
    { value: 'url', label: 'Enlace libre (URL)' },
    { value: 'article', label: 'Artículo del muro' },
    { value: 'course', label: 'Curso del muro educativo' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {linkTypeOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() =>
              onChange(
                opt.value === 'url'
                  ? { type: 'url', href: '' }
                  : opt.value === 'article'
                  ? { type: 'article', id: '', slug: '' }
                  : { type: 'course', id: '' }
              )
            }
            className={
              linkType === opt.value
                ? 'rounded-lg bg-primary-600 px-3 py-1.5 text-body-sm font-medium text-white'
                : 'rounded-lg border border-dark-300 px-3 py-1.5 text-body-sm font-medium text-dark-700 hover:bg-dark-100 dark:border-dark-600 dark:text-dark-300 dark:hover:bg-dark-800'
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      {linkType === 'url' && (
        <TextInput value={link.href} onChange={(v) => onChange({ type: 'url', href: v })} placeholder="Ej: https://... o /articulos/mi-articulo (usa #donar para abrir el modal de donación)" />
      )}

      {linkType === 'article' && (
        <select
          value={link.id}
          onChange={(e) => {
            const art = articles.find((a) => a.id === e.target.value);
            onChange(art ? { type: 'article', id: art.id, slug: art.slug } : { type: 'article', id: '', slug: '' });
          }}
          className="w-full rounded-lg border border-dark-300 bg-white px-3 py-2 text-body-md text-dark-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-dark-600 dark:bg-dark-800 dark:text-dark-100"
        >
          <option value="">Selecciona un artículo…</option>
          {articles.map((a) => (
            <option key={a.id} value={a.id}>{a.title}</option>
          ))}
        </select>
      )}

      {linkType === 'course' && (
        <select
          value={link.id}
          onChange={(e) => onChange({ type: 'course', id: e.target.value })}
          className="w-full rounded-lg border border-dark-300 bg-white px-3 py-2 text-body-md text-dark-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-dark-600 dark:bg-dark-800 dark:text-dark-100"
        >
          <option value="">Selecciona un curso…</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      )}
    </div>
  );
}

/* ═══════════════ HERO DE EDUCACIÓN ═══════════════ */

const MAX_HERO_COURSES = 6;

function EducacionHeroEditor({
  section,
  onChange,
}: {
  section: HomeSection;
  onChange: (patch: Partial<HomeSection>) => void;
}) {
  const { courses, fetchCourses } = useAppStore();
  const courseIds = section.courseIds ?? [];
  const media = section.media ?? {};
  const buttonColors = section.buttonColors ?? {};

  React.useEffect(() => {
    if (courses.length === 0) void fetchCourses().catch(() => undefined);
  }, [courses.length, fetchCourses]);

  const available = courses.filter((c) => !courseIds.includes(c.id));
  const selected = courseIds
    .map((id) => courses.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const addCourse = (id: string) => {
    if (!id || courseIds.includes(id) || courseIds.length >= MAX_HERO_COURSES) return;
    const nextMedia = { ...media };
    if (!nextMedia[id]) nextMedia[id] = { kind: 'default' };
    onChange({ courseIds: [...courseIds, id], media: nextMedia });
  };

  const removeCourse = (id: string) => {
    const nextMedia = { ...media };
    delete nextMedia[id];
    onChange({ courseIds: courseIds.filter((c) => c !== id), media: nextMedia });
  };

  const move = (index: number, dir: -1 | 1) => {
    const next = [...courseIds];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    onChange({ courseIds: next });
  };

  const setMedia = (id: string, m: HomeSlideMedia) => {
    onChange({ media: { ...media, [id]: m } });
  };

  const setButtonColor = (id: string, color: string) => {
    const next = { ...buttonColors };
    if (color.trim()) next[id] = color;
    else delete next[id];
    onChange({ buttonColors: next });
  };

  return (
    <EditorBlock
      icon={ImageIcon}
      title="Hero de Eventos (carrusel de Educación)"
      hint={
        'Elige los cursos, charlas o eventos que se destacan arriba del muro educativo. ' +
        'Cada slide se llena automáticamente con la info del curso (título, descripción, portada y enlace); ' +
        'solo añade una imagen propia o un video corto MP4 si quieres reemplazar la portada. El orden de la lista es el orden del carrusel.'
      }
    >
      <div className="mb-4 text-caption text-dark-500 dark:text-dark-400">
        {courseIds.length}/{MAX_HERO_COURSES} curso{courseIds.length === 1 ? '' : 's'} en el hero
      </div>

      {available.length > 0 && courseIds.length < MAX_HERO_COURSES ? (
        <div className="mb-6 max-w-md">
          <Field label="Añadir curso, charla o evento">
            <select
              value=""
              onChange={(e) => addCourse(e.target.value)}
              className="w-full rounded-lg border border-dark-300 bg-white px-3 py-2 text-body-md text-dark-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-dark-600 dark:bg-dark-800 dark:text-dark-100"
            >
              <option value="">Selecciona uno…</option>
              {available.map((c) => (
                <option key={c.id} value={c.id}>
                  {getPostTypeLabel(c.type)} — {c.title}
                </option>
              ))}
            </select>
          </Field>
        </div>
      ) : (
        courseIds.length >= MAX_HERO_COURSES && (
          <p className="mb-6 text-body-sm text-dark-400 dark:text-dark-500">
            Llegaste al máximo de {MAX_HERO_COURSES} slides. Quita alguno para añadir otro.
          </p>
        )
      )}

      <div className="space-y-5">
        {selected.map((course, i) => {
          const m = media[course.id] ?? { kind: 'default' as const };
          return (
            <div key={course.id} className="flex gap-3">
              <div className="flex flex-col items-center gap-1 pt-1">
                <button
                  type="button"
                  className="rounded p-1 text-dark-500 hover:bg-dark-200 disabled:opacity-30 dark:text-dark-400 dark:hover:bg-dark-700"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Subir"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="rounded p-1 text-dark-500 hover:bg-dark-200 disabled:opacity-30 dark:text-dark-400 dark:hover:bg-dark-700"
                  onClick={() => move(i, 1)}
                  disabled={i === selected.length - 1}
                  aria-label="Bajar"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 rounded-lg border border-dark-200 p-4 dark:border-dark-700">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {course.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={course.coverImage} alt="" className="h-12 w-20 shrink-0 rounded border border-dark-200 object-cover dark:border-dark-700" />
                    ) : (
                      <div className="flex h-12 w-20 shrink-0 items-center justify-center rounded border border-dashed border-dark-300 text-caption text-dark-400 dark:border-dark-600">
                        Sin portada
                      </div>
                    )}
                    <div className="min-w-0">
                      <h5 className="truncate text-body-sm font-semibold text-dark-800 dark:text-dark-200">{course.title}</h5>
                      <p className="mt-0.5 text-caption text-dark-400 dark:text-dark-500">
                        {getPostTypeLabel(course.type)}
                        {course.type === 'COURSE' ? '' : course.pricePEN || course.priceUSD ? ' · Pagado' : ' · Gratis'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCourse(course.id)}
                    className="shrink-0 rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    aria-label="Quitar del hero"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <HeroSlideMediaPicker
                  media={m}
                  courseCover={course.coverImage ?? ''}
                  onChange={(next) => setMedia(course.id, next)}
                />

                <div className="mt-4">
                  <ColorField
                    label="Color del botón «Ver detalles»"
                    value={buttonColors[course.id] ?? ''}
                    onChange={(v) => setButtonColor(course.id, v)}
                    placeholder="vacío = color del tema"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selected.length === 0 && (
        <p className="text-body-sm text-dark-400 dark:text-dark-500">
          Aún no hay cursos seleccionados. El hero solo aparece cuando eliges al menos uno.
        </p>
      )}
    </EditorBlock>
  );
}

function HeroSlideMediaPicker({
  media,
  courseCover,
  onChange,
}: {
  media: HomeSlideMedia;
  courseCover: string;
  onChange: (m: HomeSlideMedia) => void;
}) {
  const kind = media.kind;

  const kinds: Array<{ value: HomeSlideMedia['kind']; label: string }> = [
    { value: 'default', label: 'Portada del curso' },
    { value: 'image', label: 'Imagen propia' },
    { value: 'video', label: 'Video MP4 corto' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {kinds.map((k) => (
          <button
            key={k.value}
            type="button"
            onClick={() =>
              onChange(
                k.value === 'default'
                  ? { kind: 'default' }
                  : k.value === 'image'
                    ? { kind: 'image', url: media.kind === 'image' ? media.url : '', alt: media.kind === 'image' ? media.alt : undefined }
                    : { kind: 'video', url: media.kind === 'video' ? media.url : '' }
              )
            }
            className={
              kind === k.value
                ? 'rounded-lg bg-primary-600 px-3 py-1.5 text-body-sm font-medium text-white'
                : 'rounded-lg border border-dark-300 px-3 py-1.5 text-body-sm font-medium text-dark-700 hover:bg-dark-100 dark:border-dark-600 dark:text-dark-300 dark:hover:bg-dark-800'
            }
          >
            {k.label}
          </button>
        ))}
      </div>

      {kind === 'default' && (
        <p className="text-caption text-dark-400 dark:text-dark-500">
          {courseCover
            ? 'Se usará la portada actual del curso como fondo del slide.'
            : 'El curso no tiene portada; el slide usará un fondo decorativo.'}
        </p>
      )}

      {kind === 'image' && (
        <SlideImagePicker
          image={{ url: media.kind === 'image' ? media.url : '', alt: media.kind === 'image' ? media.alt : '', position: 'bg' }}
          onChange={(img) => onChange({ kind: 'image', url: img.url, alt: img.alt })}
        />
      )}

      {kind === 'video' && (
        <VideoUploadPicker
          url={media.kind === 'video' ? media.url : ''}
          onChange={(url) => onChange({ kind: 'video', url })}
        />
      )}
    </div>
  );
}

function VideoUploadPicker({ url, onChange }: { url: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = React.useState(false);
  const [compressing, setCompressing] = React.useState(false);
  const [error, setError] = React.useState('');
  const fileRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError('');
    setUploading(true);
    try {
      const ready = await compressVideoIfNeeded(file, () => setCompressing(true));
      setCompressing(false);
      const fd = new FormData();
      fd.append('file', ready);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? 'Error al subir el video.');
      }
      const data = (await res.json()) as { url: string };
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el video.');
    } finally {
      setUploading(false);
      setCompressing(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="rounded-lg border border-dashed border-dark-300 p-3 dark:border-dark-600">
      <span className="mb-2 block text-body-sm font-medium text-dark-700 dark:text-dark-300">Video de fondo (MP4 corto)</span>
      {url ? (
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            src={url}
            muted
            loop
            playsInline
            controls
            className="h-20 w-36 shrink-0 rounded border border-dark-200 bg-black object-cover dark:border-dark-700"
          />
          <div className="flex-1 space-y-2">
            <TextInput value={url} onChange={onChange} />
            <div className="flex gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="video/mp4,video/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleFile(f);
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <VideoIcon className="h-4 w-4" />}
                Reemplazar
              </Button>
              <Button type="button" variant="ghost" size="sm" className="text-red-500" onClick={() => onChange('')}>
                <Trash2 className="h-4 w-4" /> Quitar
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="video/mp4,video/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
              }}
            />
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <VideoIcon className="h-4 w-4" />}
              Subir video
            </Button>
          </div>
          <Field label="O pega la URL del video">
            <TextInput value={url} onChange={onChange} placeholder="https://... o /api/uploads/..." />
          </Field>
        </div>
      )}
      {compressing && (
        <p className="mt-2 text-body-sm font-medium text-primary-600 dark:text-primary-300">
          Comprimiendo video en tu navegador… (archivo grande, puede tardar 1-3 minutos)
        </p>
      )}
      <p className="mt-2 text-caption text-dark-400 dark:text-dark-500">
        Recomendado: MP4 liviano (máx. 65 MB). Se reproduce en bucle y sin sonido como fondo del slide.
      </p>
      {error && <p className="mt-1 text-body-sm font-medium text-red-500">{error}</p>}
    </div>
  );
}
