import type { ComponentProps } from 'react';

import { cn } from '@/utils/cn';

export default function Skeleton({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-gray-700', className)}
      {...props}
    />
  );
}
