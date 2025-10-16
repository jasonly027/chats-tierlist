import T, { type Static } from 'typebox';

export const UserSchema = T.Object({
  twitchId: T.String(),
  name: T.String(),
  displayName: T.String(),
  imageUrl: T.String(),
});

export type User = Static<typeof UserSchema>;
