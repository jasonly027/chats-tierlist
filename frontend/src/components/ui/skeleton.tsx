import type { ComponentProps } from 'react';

import { cn } from '@/utils/cn';

export default function Skeleton({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      className={cn('bg-surface animate-pulse rounded-lg', className)}
      {...props}
    />
  );
}
