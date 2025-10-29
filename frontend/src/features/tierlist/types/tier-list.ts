import type { SetTierList200TierList } from '@/lib/gen/models';

export type TierListDto = SetTierList200TierList;

export interface TierList {
  tiers: Tier[];
  pool: Item[];
  isVoting: boolean;
  focus: string | null;
  version: number;
  // Global reference to all items in tiers and pool
  _items: (Item | TieredItem)[];
}

export interface Tier {
  id: string;
  name: string;
  color: string;
  /** Sorted by non-decreasing weighted average. */
  items: TieredItem[];
}

export interface Item {
  id: string;
  name: string;
  imageUrl: string | null;
}

export interface TieredItem extends Item {
  average: number;
  totalVotes: number;
  /** Sorted by non-decreasing votes. */
  stats: { tierIdx: number; votes: number }[];
  /** A chatter's name and their vote. */
  votes: Record<string, number>;
}
