'use client';

import * as React from 'react';
import Link from 'next/link';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSiteStore } from '@/store/siteStore';

const LOGO_PATH = '/images/logo.png';

interface LogoProps {
  textClassName?: string;
  boxClassName?: string;
  iconClassName?: string;
  onClick?: () => void;
}

/**
 * Logo del sitio. Muestra siempre `public/images/logo.png` sin depender de
 * JS para ocultar/mostrar. La imagen se sirve desde el servidor de Next
 * (carpeta `public`), por lo que siempre esta disponible.
 */
export function Logo({ textClassName, boxClassName, iconClassName, onClick }: LogoProps) {
  const siteName = useSiteStore((s) => s.siteName);

  return (
    <Link
      href="/"
      onClick={onClick}
      className="relative flex items-center gap-0"
      aria-label={`${siteName} - Inicio`}
    >
      <div
        className={cn(
          'relative z-10 flex shrink-0 items-center justify-center overflow-hidden',
          boxClassName ?? 'h-8 w-8',
          'rounded-none'
        )}
      >
        <Globe className={cn('absolute h-5 w-5 text-primary-400/0', iconClassName)} aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_PATH}
          alt={siteName}
          width={200}
          height={200}
          className="relative z-10 h-full w-full object-contain"
          loading="eager"
        />
      </div>
      <span
        style={{ color: '#ffffff' }}
        className={cn('-ml-4 md:-ml-8 relative z-10 pr-10 whitespace-nowrap font-serif font-semibold italic leading-none text-white', textClassName ?? 'text-heading-md')}
      >
        {siteName}
      </span>
    </Link>
  );
}
