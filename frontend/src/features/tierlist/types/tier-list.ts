import type { SetTierList200TierList } from '@/lib/gen/models';

export type TierListDto = SetTierList200TierList;

export interface TierList {
  tiers: Tier[];
  pool: Item[];
  isVoting: boolean;
  focus: string | null;
  version: number;
  /** Item's id and item */
  items: Record<string, Item | TieredItem>;
}

export interface Tier {
  id: string;
  name: string;
  idx: number;
}

export interface Item {
  id: string;
  name: string;
  imageUrl: string | null;
}

export interface TieredItem extends Item {
  average: number;
  tierIdx: number;
  totalVotes: number;
  /** Ordered by tierIdx ASC */
  stats: { tierIdx: number; votes: number }[];
  /** A chatter's name and their vote. */
  votes: Record<string, number>;
}
