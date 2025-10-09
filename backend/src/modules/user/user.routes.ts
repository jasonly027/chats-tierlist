import axios, { AxiosResponse } from 'axios';
import { Value } from 'typebox/value';

import { env } from '@/config';
import { UserProfileResponse } from '@/modules/user/user.schemas';
import { requireAuth } from '@/server/plugins/auth';
import { nullSchema } from '@/shared/api/null.response';
import {
  UserResponseSchema,
  User as TwitchUser,
} from '@/shared/twitch/types/api';

export default function (fastify: FastifyTypeBox) {
  fastify.get(
    '/login/callback',
    { schema: { tags: ['Auth'] } },
    async (req, res) => {
      const tw = fastify.twitchOAuth2;
      const { token } = await tw.getAccessTokenFromAuthorizationCodeFlow(req);

      const user = await userProfile(token.access_token).finally(() => {
        revokeUserToken(token.access_token).catch((err: Error) => {
          req.log.warn({ err }, 'Failed to revoke token');
        });
      });

      const createUser = fastify.repo.createUserIfNotExists(user.id);
      req.session.set('user', {
        twitch_id: user.id,
        name: user.display_name,
        profileImageUrl: user.profile_image_url,
      });
      const createSession = req.session.save();

      return Promise.all([createUser, createSession]).then(() =>
        res.redirect(env.FRONTEND_URL)
      );
    }
  );

  async function userProfile(token: string): Promise<TwitchUser> {
    return axios
      .get('https://api.twitch.tv/helix/users', {
        headers: {
          ['Client-Id']: env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        const users = Value.Parse(UserResponseSchema, res.data);
        return users.data[0]!;
      });
  }

  async function revokeUserToken(token: string): Promise<AxiosResponse> {
    return axios.post(
      `https://id.twitch.tv/oauth2/revoke`,
      {
        client_id: env.TWITCH_CLIENT_ID,
        token: token,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
  }

  fastify.post(
    '/logout',
    {
      schema: {
        summary: 'Signs out the user',
        tags: ['Auth'],
        response: {
          200: nullSchema('Successfully logged out'),
        },
      },
    },
    async (req, res) => {
      await req.session.destroy();
      return res.code(200).send(null);
    }
  );

  fastify.get(
    '/auth/me',
    {
      onRequest: requireAuth,
      schema: {
        summary: "Gets the authenticated user's profile",
        tags: ['Auth'],
        response: {
          200: UserProfileResponse,
        },
        security: [{ cookieAuth: [] }],
      },
    },
    async (req, res) => {
      const { twitch_id, name, profileImageUrl } = req.user;

      return res.code(200).send({
        data: {
          twitch_id,
          display_name: name,
          profile_image_url: profileImageUrl,
        },
      });
    }
  );
}
