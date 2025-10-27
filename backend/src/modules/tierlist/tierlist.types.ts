import { Static, Type as T } from 'typebox';

import { idSchema } from '@/shared/api/id.response';
import { TextSchema } from '@/shared/api/text.schema';

export const TierColorSchema = T.Union(
  [
    T.Literal('red'),
    T.Literal('orange'),
    T.Literal('gold'),
    T.Literal('yellow'),
    T.Literal('lightgreen'),
    T.Literal('green'),
    T.Literal('skyblue'),
    T.Literal('blue'),
  ],
  { description: 'Tier background color' }
);
export type TierColor = Static<typeof TierColorSchema>;

export const TierNameSchema = TextSchema({ description: 'Name of the tier' });
export const ItemNameSchema = TextSchema({ description: 'Name of the item' });

export const TierListTierSchema = T.Object({
  id: idSchema,
  name: TierNameSchema,
  color: TierColorSchema,
});
export type Tier = Static<typeof TierListTierSchema>;

export const ItemSchema = T.Object({
  id: idSchema,
  imageUrl: T.Union([TextSchema(), T.Null()], { description: 'Image URL' }),
  votes: T.Record(
    T.String({ description: 'Name of the voter' }),
    T.Number({ description: 'Tier index' })
  ),
});
export type Item = Static<typeof ItemSchema>;

export const TierListSchema = T.Object({
  tiers: T.Array(TierListTierSchema),
  items: T.Record(ItemNameSchema, ItemSchema),
  isVoting: T.Boolean({
    description: 'Whether votes should be parsed or ignored',
  }),
  focus: T.Union([T.String(), T.Null()], {
    description: 'Name of the item to focus',
  }),
  version: T.Number({ description: 'Version number of the list' }),
});
export type TierList = Static<typeof TierListSchema>;

export const FreshTierListSchema = T.Object({
  tiers: T.Record(
    TierNameSchema,
    T.Object({
      color: TierColorSchema,
    }),
    {
      maxProperties: 50,
      description: 'Max 50 tiers',
    }
  ),
  items: T.Record(
    ItemNameSchema,
    T.Object({
      image_url: T.Optional(TextSchema({ description: 'Image URL' })),
    }),
    {
      maxProperties: 500,
      description: 'Max 500 items',
    }
  ),
});
export type FreshTierList = Static<typeof FreshTierListSchema>;
