import { Type as T, type Static } from '@fastify/type-provider-typebox';

export interface TierList {
  tiers: TierListTier[];
  items: Record<string, TierListItem>;
  isVoting: boolean;
  focus: string | null;
  version: number;
}

export interface TierListTier {
  name: string;
  color: string;
}

export interface TierListItem {
  imageUrl: string | null;
  votes: Record<string, number>;
}

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

export function tierListFromFreshTierList(tl: FreshTierList): TierList {
  const tiers = Object.entries(tl.tiers).map(([name, { color }]) => ({
    name,
    color,
  }));

  const items = Object.entries(tl.items).reduce<Record<string, TierListItem>>(
    (prev, [name, { image_url }]) => ({
      ...prev,
      [name]: {
        imageUrl: image_url ?? null,
        votes: {},
      },
    }),
    {}
  );

  return {
    tiers,
    items,
    isVoting: true,
    focus: null,
    version: Date.now(),
  };
}
