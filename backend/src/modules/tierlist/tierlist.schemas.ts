import T from 'typebox';

import {
  FreshTierListSchema,
  TierListSchema,
} from '@/modules/tierlist/tierlist.types';

export const ListenChannelParamsSchema = T.Object({
  name: T.String({ minLength: 1 }),
});

export const SetTierListRequest = T.Object({
  tier_list: FreshTierListSchema,
});

export const SetTierListResponse = T.Object({
  tier_list: TierListSchema,
});

export const FocusSchema = T.String({
  minLength: 1,
  description: 'Name of the item to focus',
});

export const IsVotingSchema = T.Boolean({
  description: 'Determine whether votes should be parsed or ignored',
});

export const UpdateTierListRequest = T.Object({
  focus: T.Optional(FocusSchema),
  is_voting: T.Optional(IsVotingSchema),
});

export const TierNameSchema = T.String({
  minLength: 1,
  description: 'Name of the tier',
});

export const TierColorSchema = T.String({
  minLength: 1,
  description: 'Background color of the tier',
});

export const AddTierRequest = T.Object({
  name: TierNameSchema,
  color: TierColorSchema,
});

export const UpdateTierRequest = T.Object({
  name: T.Optional(TierNameSchema),
  color: T.Optional(TierColorSchema),
});

export const ItemNameSchema = T.String({
  minLength: 1,
  description: 'Name of the item',
});

export const ItemImageUrlSchema = T.String({
  minLength: 1,
  description: 'Image url of the item',
});

export const AddItemRequest = T.Object({
  name: ItemNameSchema,
  image_url: T.Optional(ItemImageUrlSchema),
});

export const UpdateItemRequest = T.Object({
  name: T.Optional(ItemNameSchema),
  image_url: T.Optional(ItemImageUrlSchema),
});
