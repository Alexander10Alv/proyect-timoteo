'use client';

import * as React from 'react';
import { Heart } from 'lucide-react';

const COLORS = ['#ff5a7d', '#ff758f', '#e74c3c', '#ff8fa3', '#ff4d6d'];
const COUNT = 10;

interface HeartParticle {
  id: number;
  size: number;
  color: string;
  drift: number;
  spin: number;
  dur: number;
  delay: number;
  tilt: number;
}

let seq = 0;

function makeParticles(): HeartParticle[] {
  return Array.from({ length: COUNT }, () => {
    seq += 1;
    return {
      id: seq,
      size: 16 + Math.random() * 16,          // 16–32px
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      drift: (Math.random() - 0.5) * 60,       // -30..30px horizontal
      spin: (Math.random() - 0.5) * 40,        // -20..20deg
      dur: 0.9 + Math.random() * 0.5,          // 0.9–1.4s
      delay: Math.random() * 0.2,              // 0–0.2s
      tilt: Math.random() * 360,               // rotación inicial
    };
  });
}

interface HeartBurstProps {
  children: React.ReactNode;
  className?: string;
  auto?: number;
}

/**
 * Envuelve un botón y lanza una ráfaga de corazones hacia arriba al
 * pasar el cursor (hover), al hacer clic y, opcionalmente, cada `auto` ms
 * (intervalo automático). Respeta prefers-reduced-motion.
 */
export function HeartBurst({ children, className, auto }: HeartBurstProps) {
  const [bursts, setBursts] = React.useState<HeartParticle[]>([]);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduced = React.useRef(false);

  React.useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const trigger = React.useCallback(() => {
    if (reduced.current) return;
    setBursts((prev) => [...prev, ...makeParticles()]);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setBursts([]), 1800);
  }, []);

  React.useEffect(() => {
    if (!auto) return;
    const t = setInterval(trigger, auto);
    return () => clearInterval(t);
  }, [auto, trigger]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const positioned = /\b(fixed|absolute|sticky)\b/.test(className ?? '');

  return (
    <span
      className={`${positioned ? '' : 'relative '}inline-block ${className ?? ''}`}
      onMouseEnter={trigger}
      onClick={trigger}
    >
      {bursts.length > 0 && (
        <span className="heart-burst" aria-hidden="true">
          {bursts.map((p) => (
            <Heart
              key={p.id}
              width={p.size}
              height={p.size}
              className="heart-particle"
              fill={p.color}
              stroke={p.color}
              style={
                {
                  width: p.size,
                  height: p.size,
                  color: p.color,
                  transform: `rotate(${p.tilt}deg)`,
                  ['--dur' as string]: `${p.dur}s`,
                  ['--delay' as string]: `${p.delay}s`,
                  ['--drift' as string]: `${p.drift}px`,
                  ['--spin' as string]: `${p.spin}deg`,
                } as React.CSSProperties
              }
            />
          ))}
        </span>
      )}
      {children}
    </span>
  );
}
