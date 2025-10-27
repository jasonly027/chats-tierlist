import { Static, Type as T } from 'typebox';

export const TierListTierSchema = T.Object({
  id: T.String(),
  name: T.String(),
  color: T.String(),
});

export type TierListTier = Static<typeof TierListTierSchema>;

export const TierListItemSchema = T.Object({
  id: T.String(),
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

export const FreshTierListSchema = T.Object({
  tiers: T.Record(
    T.String({ minLength: 1, description: 'Name of the tier' }),
    T.Object({
      color: T.String({
        minLength: 1,
        description: 'Background color of the tier',
      }),
    }),
    {
      maxProperties: 50,
    }
  ),
  items: T.Record(
    T.String({ minLength: 1, description: 'Name of the item' }),
    T.Object({
      image_url: T.Optional(
        T.String({ minLength: 1, description: 'An optional image URL' })
      ),
    }),
    {
      maxProperties: 500,
    }
  ),
});

export type FreshTierList = Static<typeof FreshTierListSchema>;
