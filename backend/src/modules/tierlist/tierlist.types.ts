import { Static, Type as T } from 'typebox';

import { idSchema } from '@/shared/api/id.response';
import { TextSchema } from '@/shared/api/text.schema';

export const TierNameSchema = TextSchema({ description: 'Name of the tier' });
export const ItemNameSchema = TextSchema({ description: 'Name of the item' });

export const TierListTierSchema = T.Object({
  id: idSchema,
  name: TierNameSchema,
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

export const MAX_TIERS = 50;

export const MAX_ITEMS = 500;

export const FreshTierListSchema = T.Object({
  tiers: T.Record(TierNameSchema, T.Object({}), {
    maxProperties: MAX_TIERS,
    description: 'Max 50 tiers',
  }),
  items: T.Record(
    ItemNameSchema,
    T.Object({
      image_url: T.Optional(TextSchema({ description: 'Image URL' })),
    }),
    {
      maxProperties: MAX_ITEMS,
      description: 'Max 500 items',
    }
  ),
});
export type FreshTierList = Static<typeof FreshTierListSchema>;
