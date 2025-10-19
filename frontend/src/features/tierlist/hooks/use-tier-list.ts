import { createContext, use } from 'react';

import type { TierList } from '@/features/tierlist/types/tier-list';
import type { UpdateTierBody } from '@/lib/gen/models';

export interface TierListContext {
  getQueryKey: () => string[];
  tierList: TierList | undefined;
  isLoading: boolean;
  setTierList: (action: TierListSetAction) => void;
}

export type TierListSetAction = {
  action: 'updateTier';
  payload: {
    tierName: string;
    data: UpdateTierBody;
  };
};

export const TierListContext = createContext<TierListContext | undefined>(
  undefined
);

export function useTierList(): TierListContext {
  const context = use(TierListContext);

  if (context === undefined) {
    throw new Error('useTierList hook called outside of provider');
  }

  return context;
}

export type setTierListFn = () => void;
