import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  strength?: 'default' | 'strong';
}

export function Card({ className, strength = 'default', ...props }: CardProps) {
  return (
    <div
      className={cn('glass-card', strength === 'strong' && 'glass-card--strong', className)}
      {...props}
    />
  );
}
