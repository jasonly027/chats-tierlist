import type { ComponentPropsWithRef } from 'react';

import { cn } from '@/utils/cn';

export default function Input({
  className,
  ...props
}: ComponentPropsWithRef<'input'>) {
  return (
    <input
      size={1}
      className={cn(
        'focus:border-accent rounded-sm border-1 px-2 py-1 transition-colors duration-300 focus:outline-0',
        className
      )}
      {...props}
    />
  );
}
