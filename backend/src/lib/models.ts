// Database models

import type { TierListItem, TierListTier } from 'types.js';

export interface User {
  id: number;
  twitch_id: string;
  voting: boolean;
  tiers: TierListTier[];
  items: TierListItem[];
}
