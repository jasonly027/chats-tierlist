import T, { type Static } from 'typebox';

export const UserSchema = T.Object({
  name: T.String(),
  twitchId: T.String(),
  imageUrl: T.String(),
});

export type User = Static<typeof UserSchema>;
