import T, { Static } from 'typebox';

// https://dev.twitch.tv/docs/authentication/refresh-tokens/
export const RefreshSchema = T.Object({
  access_token: T.String(),
  refresh_token: T.String(),
});
export type Refresh = Static<typeof RefreshSchema>;

// https://dev.twitch.tv/docs/api/reference/#get-users
export const UserSchema = T.Object({
  id: T.String(),
  login: T.String(),
  display_name: T.String(),
  profile_image_url: T.String({ format: 'url' }),
});
export type User = Static<typeof UserSchema>;

export const UserResponseSchema = T.Object({
  data: T.Array(UserSchema),
});
export type UserResponse = Static<typeof UserResponseSchema>;

// https://dev.twitch.tv/docs/api/reference/#search-channels
export const SearchChannelSchema = T.Object({
  id: T.String(),
  broadcaster_login: T.String(),
  display_name: T.String(),
  is_live: T.Boolean(),
  thumbnail_url: T.String({ format: 'url' }),
});
export type SearchChannel = Static<typeof SearchChannelSchema>;

export const SearchChannelResponseSchema = T.Object({
  data: T.Array(SearchChannelSchema),
});
export type SearchChannelResponse = Static<typeof SearchChannelResponseSchema>;

// https://dev.twitch.tv/docs/api/reference#get-eventsub-subscriptions
export const SubscriptionSchema = T.Object({
  id: T.String(),
});
export type Subscription = Static<typeof SubscriptionSchema>;

export const SubscriptionsResponseSchema = T.Object({
  data: T.Array(SubscriptionSchema),
  total: T.Number(),
  total_cost: T.Number(),
  max_total_cost: T.Number(),
});
export type SubscriptionsResponse = Static<typeof SubscriptionsResponseSchema>;
