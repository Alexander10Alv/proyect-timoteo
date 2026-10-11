'use client';

import * as React from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { MapPin, Globe, Users, Flag, ExternalLink, Plus, Minus, RotateCcw } from 'lucide-react';
import type { JoshuaProjectCountry } from '@/types';
import { formatNumber, formatPercentage } from '@/lib/utils';
import { alpha3FromNumericId } from '@/lib/isoAlpha3';

const GEO_URL = '/maps/world-110m.json';

/** Color según progreso evangélico (paleta sobria de la plataforma). */
function progressColor(value: number): string {
  if (value >= 70) return '#4d7c0f'; // verde oliva — 70 a 100
  if (value >= 45) return '#a16207'; // dorado oscuro — 45 a 70
  if (value >= 25) return '#c87a4a'; // terracota — 25 a 45
  return '#b91c1c';                  // rojo profundo — 5 a 25
}

interface WorldMapProps {
  countries: JoshuaProjectCountry[];
  selectedCountry?: JoshuaProjectCountry;
  onSelectCountry: (country: JoshuaProjectCountry) => void;
  loading?: boolean;
}

interface TooltipState {
  x: number;
  y: number;
  country: JoshuaProjectCountry;
}

export function WorldMap({ countries, onSelectCountry, loading }: WorldMapProps) {
  const [tooltip, setTooltip] = React.useState<TooltipState | null>(null);
  // En móvil el mapa se muestra vertical (slice) y con menos zoom inicial.
  const [isMobile, setIsMobile] = React.useState(false);
  const [pos, setPos] = React.useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: [0, 10],
    zoom: 1.69,
  });
  const [hint, setHint] = React.useState(true);
  // Cursor personalizado (lupa con globo girando)
  const [cursor, setCursor] = React.useState<{ x: number; y: number } | null>(null);
  const mapRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const mobile = window.matchMedia('(max-width: 767px)').matches;
    setIsMobile(mobile);
    if (mobile) setPos((p) => ({ ...p, zoom: Math.min(p.zoom, 1) }));
  }, []);

  // Índice Alpha-3 → país para cruce rápido con el TopoJSON.
  const byCode = React.useMemo(() => {
    const map = new Map<string, JoshuaProjectCountry>();
    countries.forEach((c) => map.set(c.code.toUpperCase(), c));
    return map;
  }, [countries]);

  const handleMouseMove = (e: React.MouseEvent, country: JoshuaProjectCountry) => {
    setTooltip({ x: e.clientX, y: e.clientY, country });
  };

  const zoomBy = (f: number) =>
    setPos((p) => ({ ...p, zoom: Math.min(6, Math.max(1, p.zoom * f)) }));

  const resetView = () => {
    setPos({ coordinates: [0, 10], zoom: isMobile ? 1 : 1.69 });
    setHint(true);
  };

  React.useEffect(() => {
    if (!pos.zoom || pos.zoom > 1 || (pos.coordinates[0] !== 0 && pos.coordinates[1] !== 10)) {
      setHint(false);
    } else {
      setHint(true);
    }
  }, [pos]);

  if (loading) {
    return (
      <div className="aspect-[3/4] w-full animate-pulse rounded-2xl bg-dark-100 md:aspect-[5/2] dark:bg-dark-800" />
    );
  }

  return (
    <div
      ref={mapRef}
      className="group relative cursor-none overflow-hidden rounded-2xl bg-gradient-to-br from-primary-400/70 via-white/40 to-primary-400/70 p-px transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_28px_70px_-24px_rgba(30,27,75,0.55)] dark:from-primary-500/60 dark:via-dark-800/40 dark:to-primary-500/60"
      onMouseMove={(e) => {
        const rect = mapRef.current?.getBoundingClientRect();
        if (!rect) return;
        setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      onMouseLeave={() => setCursor(null)}
    >
      {/* Cursor personalizado: lupa con globo girando */}
      {cursor && (
        <div
          className="pointer-events-none absolute z-50 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-sky-300 bg-sky-950/40 backdrop-blur-sm shadow-[0_0_20px_rgba(56,189,248,0.7),inset_0_0_8px_rgba(255,255,255,0.25)]"
          style={{ left: cursor.x, top: cursor.y }}
          aria-hidden="true"
        >
          <span className="h-5 w-5 animate-[spin_2.5s_linear_infinite] text-sky-200">
            <Globe className="h-5 w-5" aria-hidden="true" />
          </span>
          <span aria-hidden="true" className="absolute bottom-[-3px] right-[-3px] h-3 w-3 rounded-full border border-sky-300 bg-sky-500/40" />
        </div>
      )}
      {/* Capa de cristal: degradado + blur */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/80 via-primary-50/60 to-primary-100/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_18px_45px_-20px_rgba(30,27,75,0.35)] backdrop-blur-2xl dark:from-dark-900/85 dark:via-dark-900/75 dark:to-primary-950/40" />

      {/* Esquinas HUD */}
      {[
        'top-2 left-2 border-t-2 border-l-2 rounded-tl-lg',
        'top-2 right-2 border-t-2 border-r-2 rounded-tr-lg',
        'bottom-2 left-2 border-b-2 border-l-2 rounded-bl-lg',
        'bottom-2 right-2 border-b-2 border-r-2 rounded-br-lg',
      ].map((cls) => (
        <span
          key={cls}
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute z-10 h-5 w-5 border-primary-500/70 dark:border-primary-400/70',
            cls
          )}
          style={{ filter: 'drop-shadow(0 0 6px rgba(124,58,237,0.6))' }}
        />
      ))}

      {/* Glow central (brillo suave bajo los países) */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[70%] w-[75%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60"
        style={{ background: 'radial-gradient(closest-side, rgba(124,58,237,0.14), transparent)' }}
        aria-hidden="true"
      />

      <ComposableMap
        projectionConfig={{ scale: 147, center: [0, 10] }}
        width={980}
        height={500}
        className="world-ocean relative z-[1] aspect-[3/4] md:aspect-[5/2]"
        preserveAspectRatio={isMobile ? 'xMidYMid slice' : undefined}
        style={{ width: '100%', height: 'auto', filter: 'drop-shadow(0 12px 28px rgba(30,27,75,0.10))' }}
        role="img"
        aria-label="Mapa mundial interactivo: arrastra para mover, botones +/− para zoom, clic para ver un país"
      >
        <ZoomableGroup
          zoom={pos.zoom}
          center={pos.coordinates}
          filterZoomEvent={(event) => {
            const e = (event ?? null) as { type?: string } | null;
            return !!e && e.type !== 'wheel' && e.type !== 'dblclick';
          }}
          onMoveEnd={(p) => setPos({ coordinates: p.coordinates, zoom: p.zoom })}
          translateExtent={[[-500, -400], [1500, 900]]}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const alpha3 = alpha3FromNumericId(geo.id as string);
                const country = alpha3 ? byCode.get(alpha3) : undefined;

                const fill = country
                  ? progressColor(country.progressBarValue)
                  : '#ded8cc'; // gris cálido para países sin registro
                const stroke = country ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.5)';

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={country ? 0.55 : 0.35}
                    style={{
                      default: {
                        outline: 'none',
                        opacity: country ? 0.92 : 0.45,
                        transition: 'opacity 0.2s ease, fill 0.2s ease',
                      },
                      hover: {
                        outline: 'none',
                        opacity: 1,
                        stroke: '#ffffff',
                        strokeWidth: 1.35,
                        filter: 'brightness(1.18) saturate(1.1)',
                        cursor: country ? 'pointer' : 'default',
                      },
                      pressed: { outline: 'none', opacity: 1 },
                    }}
                    tabIndex={country ? 0 : -1}
                    aria-label={country ? `${country.name}: ${Math.round(country.progressBarValue)}% evangelizado` : undefined}
                    onMouseEnter={(e) => country && handleMouseMove(e, country)}
                    onMouseMove={(e) => country && handleMouseMove(e, country)}
                    onMouseLeave={() => setTooltip(null)}
                    onClick={() => country && onSelectCountry(country)}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Glow central (brillo suave sobre el mar) */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-[2] h-[70%] w-[75%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40"
        style={{ background: 'radial-gradient(closest-side, rgba(255,255,255,0.30), transparent)' }}
        aria-hidden="true"
      />

      {/* Rejilla tecnológica sobre el mapa */}
      <div
        className="pointer-events-none absolute inset-0 z-[2] rounded-2xl opacity-30 mix-blend-overlay"
        style={{
          backgroundImage:
            'linear-gradient(rgba(124,58,237,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.18) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
        aria-hidden="true"
      />

      {/* Controles de zoom (cristal) */}
      <div className="absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-1.5 rounded-xl border border-white/50 bg-white/55 p-1.5 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-dark-900/70">
        <button
          type="button"
          onClick={() => zoomBy(1.3)}
          aria-label="Acercar"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-dark-700 transition-colors hover:bg-primary-500/15 hover:text-primary-700 dark:text-dark-200 dark:hover:text-primary-300"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
        <span className="px-0.5 text-center font-mono text-[10px] font-semibold text-dark-500 dark:text-dark-400">
          {Math.round(pos.zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={() => zoomBy(1 / 1.3)}
          aria-label="Alejar"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-dark-700 transition-colors hover:bg-primary-500/15 hover:text-primary-700 dark:text-dark-200 dark:hover:text-primary-300"
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={resetView}
          aria-label="Restablecer vista"
          className="flex h-8 w-8 items-center justify-center rounded-lg border-t border-white/50 pt-0 text-dark-700 transition-colors hover:bg-primary-500/15 hover:text-primary-700 dark:border-white/10 dark:text-dark-200 dark:hover:text-primary-300"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* Pista de uso */}
      {hint && (
        <div className="pointer-events-none absolute right-3 top-3 z-20 rounded-lg border border-white/50 bg-white/55 px-2.5 py-1 text-[11px] font-medium text-dark-600 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-dark-900/70 dark:text-dark-300">
          Zoom: botones +/− · Arrastra: mover
        </div>
      )}

      {/* Tooltip flotante (cristal) */}
      {tooltip && (
        <div
          role="tooltip"
          className="pointer-events-none fixed z-50 w-56 -translate-x-1/2 -translate-y-full rounded-xl border border-white/60 bg-white/85 p-3.5 shadow-[0_18px_40px_-12px_rgba(30,27,75,0.35)] backdrop-blur-2xl dark:border-white/10 dark:bg-dark-900/85"
          style={{ left: tooltip.x, top: tooltip.y - 16 }}
        >
          <p className="font-serif text-heading-md font-semibold text-dark-900 dark:text-dark-100">
            {tooltip.country.name}
            <span className="ml-2 font-mono text-caption text-dark-400">{tooltip.country.code}</span>
          </p>
          <dl className="mt-2 space-y-1 text-caption text-dark-600 dark:text-dark-300">
            <div className="flex justify-between gap-3">
              <dt>Población</dt>
              <dd className="font-mono font-semibold">{formatNumber(tooltip.country.totalPopulation)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>No alcanzados</dt>
              <dd className="font-mono font-semibold text-red-600 dark:text-red-400">
                {tooltip.country.unreachedGroups}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Evangélicos</dt>
              <dd className="font-mono font-semibold">{formatPercentage(tooltip.country.evangelicalPercentage)}</dd>
            </div>
          </dl>
          <p className="mt-2 border-t border-primary-100 pt-2 text-caption font-medium text-primary-600 dark:border-primary-900/40 dark:text-primary-400">
            Clic para ver detalles y donar
          </p>
        </div>
      )}

      {/* Leyenda (cristal) */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-20 flex flex-wrap gap-x-3 gap-y-1 rounded-xl border border-white/50 bg-white/60 px-3 py-2 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-dark-900/70">
        {[
          { color: '#b91c1c', label: '5-25%' },
          { color: '#c87a4a', label: '25-45%' },
          { color: '#a16207', label: '45-70%' },
          { color: '#4d7c0f', label: '70-100%' },
          { color: '#ded8cc', label: 'Sin registro' },
        ].map((item) => (
          <span key={item.label} className="flex items-center gap-1.5 text-caption font-medium text-dark-600 dark:text-dark-300">
            <span className="h-2.5 w-2.5 rounded-full shadow-[0_0_6px_rgba(0,0,0,0.15)]" style={{ backgroundColor: item.color }} aria-hidden="true" />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

interface CountryCardProps {
  country: JoshuaProjectCountry;
  onClick: () => void;
  isSelected?: boolean;
}

export function CountryCard({ country, onClick, isSelected }: CountryCardProps) {
  return (
    <article
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer',
        isSelected
          ? 'border-primary-500 ring-2 ring-primary-500/20 bg-primary-50 dark:bg-primary-900/10'
          : 'border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-lg'
      )}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }}}
      role="button"
      aria-pressed={isSelected}
      aria-label={`Ver detalles de ${country.name}`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
              <Flag className="h-5 w-5 text-primary-600 dark:text-primary-400" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-serif text-heading-md font-semibold text-dark-900 dark:text-dark-100">
                {country.name}
              </h3>
              <p className="text-caption text-dark-500 dark:text-dark-400 uppercase tracking-wider">
                {country.code}
              </p>
            </div>
          </div>

          <div className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
            country.progressBarValue >= 70 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
            country.progressBarValue >= 45 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
            country.progressBarValue >= 25 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
            country.progressBarValue >= 5 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
            'bg-red-950 text-red-100 dark:bg-red-950/70 dark:text-red-200'
          )}>
            {Math.round(country.progressBarValue)}%
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-dark-50 dark:bg-dark-800/50 p-3">
              <p className="text-caption text-dark-500 dark:text-dark-400">Población</p>
              <p className="font-semibold text-dark-900 dark:text-dark-100">{formatNumber(country.totalPopulation)}</p>
            </div>
            <div className="rounded-lg bg-dark-50 dark:bg-dark-800/50 p-3">
              <p className="text-caption text-dark-500 dark:text-dark-400">Grupos Étnicos</p>
              <p className="font-semibold text-dark-900 dark:text-dark-100">{country.ethnicGroupsCount}</p>
            </div>
            <div className="rounded-lg bg-dark-50 dark:bg-dark-800/50 p-3">
              <p className="text-caption text-dark-500 dark:text-dark-400">No Alcanzados</p>
              <p className="font-semibold text-red-600 dark:text-red-400">{country.unreachedGroups}</p>
            </div>
            <div className="rounded-lg bg-dark-50 dark:bg-dark-800/50 p-3">
              <p className="text-caption text-dark-500 dark:text-dark-400">% Evangélico</p>
              <p className="font-semibold text-dark-900 dark:text-dark-100">{formatPercentage(country.evangelicalPercentage)}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-dark-600 dark:text-dark-400">
            <Globe className="h-4 w-4 text-primary-500" aria-hidden="true" />
            <span>{country.primaryLanguage}</span>
          </div>
          <div className="flex items-center gap-2 text-dark-600 dark:text-dark-400">
            <Users className="h-4 w-4 text-primary-500" aria-hidden="true" />
            <span>{country.primaryReligion}</span>
          </div>
        </div>
      </div>

      <div className={cn(
        'border-t px-5 py-4 transition-colors',
        isSelected ? 'bg-primary-50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800' : 'border-dark-200 dark:border-dark-700'
      )}>
        <Button
          variant={isSelected ? 'primary' : 'outline'}
          size="sm"
          className="w-full"
          onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
          <MapPin className="h-4 w-4 mr-2" aria-hidden="true" />
          Ver Detalles
          <ExternalLink className="h-4 w-4 ml-2" aria-hidden="true" />
        </Button>
      </div>
    </article>
  );
}

interface CountryListProps {
  countries: JoshuaProjectCountry[];
  selectedCountry?: JoshuaProjectCountry;
  onSelectCountry: (country: JoshuaProjectCountry) => void;
  loading?: boolean;
}

export function CountryList({ countries, selectedCountry, onSelectCountry, loading }: CountryListProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-64 bg-dark-200 dark:bg-dark-700 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (countries.length === 0) {
    return (
      <div className="text-center py-12">
        <Globe className="h-12 w-12 mx-auto text-dark-300 dark:text-dark-600 mb-4" aria-hidden="true" />
        <h3 className="text-heading-md font-semibold text-dark-900 dark:text-dark-100 mb-2">
          No se encontraron países
        </h3>
        <p className="text-body-md text-dark-500 dark:text-dark-400">
          Intenta ajustar tus filtros de búsqueda
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {countries.map((country) => (
        <CountryCard
          key={country.id}
          country={country}
          onClick={() => onSelectCountry(country)}
          isSelected={selectedCountry?.id === country.id}
        />
      ))}
    </div>
  );
}