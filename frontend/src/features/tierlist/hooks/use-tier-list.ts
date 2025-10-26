import { createContext, use } from 'react';

import type { TierList } from '@/features/tierlist/types/tier-list';
import type { UpdateItemBody, UpdateTierBody } from '@/lib/gen/models';

export interface TierListContextValues {
  getQueryKey: () => string[];
  tierList: TierList | undefined;
  isLoading: boolean;
  updateTier: (tierName: string, data: UpdateTierBody) => boolean;
  updateItem: (itemName: string, data: UpdateItemBody) => boolean;
}

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
