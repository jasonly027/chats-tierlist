import type { DefaultOptions } from '@tanstack/react-query';

export const queryConfig = {
  queries: {
    retry: 3,
  },
} satisfies DefaultOptions;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type QueryConfig<T extends (...args: any[]) => any> = Omit<
  ReturnType<T>,
  'queryKey' | 'queryFn'
>;
