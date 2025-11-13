import T from 'typebox';

import {
  FreshTierListSchema,
  TierListSchema,
  TierNameSchema,
  ItemNameSchema,
} from '@/modules/tierlist/tierlist.types';
import { TextSchema } from '@/shared/api/text.schema';
import { UrlSchema } from '@/shared/api/url.schema';

export const ListenChannelParamsSchema = T.Object({
  name: T.String({ minLength: 1 }),
});

export const SetTierListRequest = T.Object({
  tier_list: FreshTierListSchema,
});

export const SetTierListResponse = T.Object({
  tier_list: TierListSchema,
});

export const UpdateTierListRequest = T.Object({
  focus: T.Optional(
    T.Union([
      TextSchema({ description: 'Name of the item to focus' }),
      T.Null(),
    ])
  ),
  is_voting: T.Optional(
    T.Boolean({
      description: 'Determine whether votes should be parsed or ignored',
    })
  ),
});

export const AddTierRequest = T.Object({
  name: TierNameSchema,
});

export const UpdateTierRequest = T.Object({
  name: T.Optional(TierNameSchema),
});

export const ItemImageUrlSchema = T.Union([
  UrlSchema({
    description: 'Image url of the item',
  }),
  T.Null(),
]);

export const AddItemRequest = T.Object({
  name: ItemNameSchema,
  image_url: T.Optional(ItemImageUrlSchema),
});

export const UpdateItemRequest = T.Object({
  name: T.Optional(ItemNameSchema),
  image_url: T.Optional(ItemImageUrlSchema),
});
