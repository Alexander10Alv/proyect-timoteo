'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { getProgressBgColor, getProgressColor } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  showLabel?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'auto' | 'primary' | 'success' | 'warning' | 'danger';
}

export function Progress({
  value,
  max = 100,
  showLabel = false,
  label,
  size = 'md',
  color = 'auto',
  className,
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const getColorClass = () => {
    if (color !== 'auto') {
      const colorMap = {
        primary: 'bg-primary-500',
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        danger: 'bg-red-500',
      };
      return colorMap[color];
    }
    return getProgressBgColor(percentage);
  };

  const getLabelColorClass = () => {
    if (color !== 'auto') return 'text-dark-600 dark:text-dark-300';
    return getProgressColor(percentage);
  };

  return (
    <div className={cn('w-full', className)} {...props}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1.5">
          <span className={cn('text-sm font-medium', getLabelColorClass())}>
            {label || `${Math.round(percentage)}%`}
          </span>
          {showLabel && (
            <span className="text-sm text-dark-500 dark:text-dark-400 font-mono">
              {value} / {max}
            </span>
          )}
        </div>
      )}
      <div className={cn('relative overflow-hidden rounded-full bg-dark-200 dark:bg-dark-700', sizes[size])}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            getColorClass()
          )}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label || 'Progreso'}
        />
      </div>
    </div>
  );
}

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  label?: string;
  color?: 'auto' | 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function CircularProgress({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  showLabel = true,
  label,
  color = 'auto',
  className,
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const getColorClass = () => {
    if (color !== 'auto') {
      const colorMap = {
        primary: 'text-primary-500',
        success: 'text-green-500',
        warning: 'text-yellow-500',
        danger: 'text-red-500',
      };
      return colorMap[color];
    }
    return getProgressColor(percentage);
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-dark-200 dark:text-dark-700"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={cn('transition-all duration-500 ease-out', getColorClass())}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
        />
      </svg>
      {(showLabel || label) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {label && <span className="text-sm text-dark-500 dark:text-dark-400">{label}</span>}
          <span className={cn('font-bold', getColorClass(), size > 100 ? 'text-2xl' : 'text-lg')}>
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
}