'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SeparatorProps extends React.HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
}

const Separator = React.forwardRef<HTMLHRElement, SeparatorProps>(
  ({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => (
    <hr
      ref={ref}
      className={cn(
        'border-0 bg-dark-200 dark:bg-dark-700',
        orientation === 'horizontal' ? 'w-full h-px' : 'h-full w-px',
        className
      )}
      aria-orientation={orientation}
      role={decorative ? 'none' : 'separator'}
      {...props}
    />
  )
);

Separator.displayName = 'Separator';

export { Separator };