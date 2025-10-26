import { Type as T, type Static } from 'typebox';

export const TierDtoSchema = T.Object({
  name: T.String(),
  color: T.String(),
});

export type TierDto = Static<typeof TierDtoSchema>;

export const ItemDtoSchema = T.Object({
  imageUrl: T.Union([T.String(), T.Null()]),
  votes: T.Record(T.String(), T.Number()),
});

export type ItemDto = Static<typeof ItemDtoSchema>;

export const TierListDtoSchema = T.Object({
  tiers: T.Array(TierDtoSchema),
  items: T.Record(T.String(), ItemDtoSchema),
  isVoting: T.Boolean(),
  focus: T.Union([T.String(), T.Null()]),
  version: T.Number(),
});

export type TierListDto = Static<typeof TierListDtoSchema>;

export interface TierList {
  tiers: Tier[];
  pool: Item[];
  isVoting: boolean;
  focus: string | null;
  version: number;
  // Global reference to all items in tiers and pool
  _items: Item[];
}

export interface Tier {
  name: string;
  color: string;
  /** Sorted by non-decreasing weighted average. */
  items: TieredItem[];
}

export interface Item {
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
