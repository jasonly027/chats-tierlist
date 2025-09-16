import z from 'zod';

// https://dev.twitch.tv/docs/api/reference/#get-users
export const UserSchema = z.object({
  id: z.string(),
  login: z.string(),
  display_name: z.string(),
  profile_image_url: z.url(),
});
export type User = z.infer<typeof UserSchema>;

export const UserResponseSchema = z.object({
  data: z.array(UserSchema),
});
export type UserResponse = z.infer<typeof UserResponseSchema>;

// https://dev.twitch.tv/docs/api/reference/#search-channels
export const SearchChannelSchema = z.object({
  id: z.string(),
  broadcaster_login: z.string(),
  display_name: z.string(),
  is_live: z.boolean(),
  thumbnail_url: z.url(),
});
export type SearchChannel = z.infer<typeof SearchChannelSchema>;

export const SearchChannelResponseSchema = z.object({
  data: z.array(SearchChannelSchema),
});
export type SearchChannelResponse = z.infer<typeof SearchChannelResponseSchema>;

// https://dev.twitch.tv/docs/api/reference#get-eventsub-subscriptions
export const SubscriptionSchema = z.object({
  id: z.string(),
});
export type Subscription = z.infer<typeof SubscriptionSchema>;

export const SubscriptionsResponseSchema = z.object({
  data: z.array(SubscriptionSchema),
  total: z.int(),
  total_cost: z.int(),
  max_total_cost: z.int(),
});
export type SubscriptionsResponse = z.infer<typeof SubscriptionsResponseSchema>;
