import T from 'typebox';

export const UserProfileResponse = T.Object({
  data: T.Object({
    twitch_id: T.String(),
    display_name: T.String(),
    profile_image_url: T.String({ format: 'url' }),
  }),
});
