'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  lines = 1,
  ...props
}: SkeletonProps) {
  if (variant === 'circular') {
    return (
      <div
        className={cn('animate-pulse rounded-full bg-dark-200 dark:bg-dark-700', className)}
        style={{ width, height, minWidth: width, minHeight: height }}
        {...props}
      />
    );
  }

  if (variant === 'rectangular') {
    return (
      <div
        className={cn('animate-pulse rounded-lg bg-dark-200 dark:bg-dark-700', className)}
        style={{ width, height }}
        {...props}
      />
    );
  }

  return (
    <div className={cn('space-y-2', className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'animate-pulse h-4 rounded bg-dark-200 dark:bg-dark-700',
            i === lines - 1 && 'w-3/4',
            i !== lines - 1 && 'w-full'
          )}
          style={{ width: i === lines - 1 ? width : undefined }}
        />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton variant="rectangular" className="aspect-video" />
      <div className="space-y-3 px-2">
        <Skeleton variant="text" width="3/4" />
        <Skeleton variant="text" width="1/2" />
        <Skeleton variant="text" width="5/6" />
      </div>
    </div>
  );
}

export function PostCardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton variant="rectangular" className="aspect-[16/10]" />
      <div className="space-y-2 px-1">
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" width={32} height={32} />
          <div className="space-y-1">
            <Skeleton variant="text" width="48" height={16} />
            <Skeleton variant="text" width="32" height={12} />
          </div>
        </div>
        <Skeleton variant="text" width="3/4" />
        <Skeleton variant="text" width="1/2" />
      </div>
    </div>
  );
}

export function CountryDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <CardSkeleton />
      <div className="grid gap-4 md:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}