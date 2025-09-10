import type { TierListItem, TierListTier } from '@src/types.js';

export interface User {
  id: number;
  twitch_id: string;
  voting: boolean;
  tiers: TierListTier[];
  items: TierListItem[];
}
