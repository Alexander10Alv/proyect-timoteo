'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const DIRECTION_CLASSES = {
  top: '-translate-y-10',
  bottom: 'translate-y-10',
  left: '-translate-x-10',
  right: 'translate-x-10',
} as const;

type RevealFrom = keyof typeof DIRECTION_CLASSES;

/**
 * Revela su contenido al entrar en el viewport mientras se hace scroll.
 * `from` define desde dónde entra: 'top' | 'bottom' | 'left' | 'right'.
 */
export function Reveal({
  children,
  from = 'bottom',
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  from?: RevealFrom;
  delay?: number;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        'transition-all duration-700 ease-out',
        visible ? 'translate-x-0 translate-y-0 opacity-100' : cn('opacity-0', DIRECTION_CLASSES[from]),
        className
      )}
    >
      {children}
    </div>
  );
}