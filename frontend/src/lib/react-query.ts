import type { DefaultOptions } from '@tanstack/react-query';

export const queryConfig = {
  queries: {
    retry: 3,
  },
} satisfies DefaultOptions;
