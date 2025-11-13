import type { ComponentPropsWithRef } from 'react';

import { cn } from '@/utils/cn';

export default function Button({
  type,
  className,
  ...props
}: ComponentPropsWithRef<'button'>) {
  return (
    <button
      type={type}
      className={cn(
        'rounded-sm border-2 border-gray-900 bg-slate-700 px-2.5 py-1.5 font-semibold text-nowrap hover:bg-slate-600',
        className
      )}
      {...props}
    ></button>
  );
}
