'use client';

import 'leaflet/dist/leaflet.css';

import * as React from 'react';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import type { JpPeopleGroup } from '@/types';

// Coordenadas por defecto: centro de Perú
const DEFAULT_CENTER: [number, number] = [-9.19, -75.0156];
const DEFAULT_ZOOM = 6;

// Colores por JPScale
const SCALE_COLORS: Record<number, string> = {
  1: '#27ae60', // 1 - Completamente alcanzado (verde)
  2: '#2ecc71', // 2 - Mayormente alcanzado
  3: '#f1c40f', // 3 - Parcialmente alcanzado (amarillo)
  4: '#8e44ad', // 4 - Poco alcanzado (púrpura)
  5: '#e74c3c', // 5 - Muy poco alcanzado (rojo)
};

function getMarkerColor(scale: number | null | undefined): string {
  if (scale == null) return '#95a5a6'; // gris para sin dato
  const rounded = Math.round(scale);
  return SCALE_COLORS[rounded] || '#95a5a6';
}

interface CountryMapProps {
  peopleGroups: JpPeopleGroup[];
  countryCode?: string;
  onGroupClick?: (peopCode: string) => void;
}

function CountryMapInner({ peopleGroups, onGroupClick }: CountryMapProps) {
  const groupsWithCoords = React.useMemo(
    () => peopleGroups.filter((g) => g.latitude != null && g.longitude != null),
    [peopleGroups]
  );

  return (
    <div className="relative h-[400px] w-full overflow-hidden rounded-xl border border-dark-200 dark:border-dark-700">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={false}
        className="h-full w-full"
        style={{ background: '#e8e4df' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {groupsWithCoords.map((g) => (
          <Marker
            key={g.id}
            position={[g.latitude!, g.longitude!]}
            icon={new L.DivIcon({
              className: 'country-map-marker',
              html: `<div style="
                width: 12px; height: 12px;
                background: ${getMarkerColor(g.progressScale)};
                border: 2px solid #fff;
                border-radius: 50%;
                box-shadow: 0 1px 4px rgba(0,0,0,0.3);
                cursor: pointer;
              "></div>`,
              iconSize: [12, 12],
              iconAnchor: [6, 6],
            })}
            eventHandlers={{
              click: () => {
                if (onGroupClick) onGroupClick(g.peopCode);
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
              <div style={{ fontSize: 13, maxWidth: 220 }}>
                <strong>{g.peopleName}</strong>
                <br />
                {g.populationInCountry?.toLocaleString()} hab.
                {g.progressScale != null && (
                  <>
                    <br />
                    JPScale: {g.progressScale.toFixed(1)}
                  </>
                )}
                {g.primaryLanguage && (
                  <>
                    <br />
                    {g.primaryLanguage}
                  </>
                )}
              </div>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>

      {/* Leyenda de colores */}
      <div className="absolute bottom-3 right-3 z-[1000] rounded-lg bg-white/90 px-3 py-2 text-xs shadow-md dark:bg-dark-900/90">
        <p className="mb-1 font-medium text-dark-700 dark:text-dark-300">JPScale</p>
        <div className="flex flex-col gap-1">
          {Object.entries(SCALE_COLORS).map(([scale, color]) => (
            <div key={scale} className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
              <span className="text-dark-600 dark:text-dark-400">{scale}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CountryMap(props: CountryMapProps) {
  return <CountryMapInner {...props} />;
}
