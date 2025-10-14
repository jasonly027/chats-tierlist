import { Type as T, type Static } from 'typebox';

export const TierListTierSchema = T.Object({
  name: T.String(),
  color: T.String(),
});

export type TierListTier = Static<typeof TierListTierSchema>;

export const TierListItemSchema = T.Object({
  imageUrl: T.Union([T.String(), T.Null()]),
  votes: T.Record(T.String(), T.Number()),
});

export type TierListItem = Static<typeof TierListItemSchema>;

export const TierListSchema = T.Object({
  tiers: T.Array(TierListTierSchema),
  items: T.Record(T.String(), TierListItemSchema),
  isVoting: T.Boolean(),
  focus: T.Union([T.String(), T.Null()]),
  version: T.Number(),
});

export type TierList = Static<typeof TierListSchema>;
