import { createContext, use } from 'react';

import type { TierListContextValues } from '@/features/tierlist/providers/tier-list-provider';

export const TierListContext = createContext<TierListContextValues | undefined>(
  undefined
);

export function useTierList(): TierListContextValues {
  const context = use(TierListContext);

  if (context === undefined) {
    throw new Error('useTierList hook called outside of provider');
  }

  return context;
}
