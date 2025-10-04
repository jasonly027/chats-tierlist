import fastifyCookie from '@fastify/cookie';
import fastifyOauth2, { type OAuth2Namespace } from '@fastify/oauth2';
import fastifySession from '@fastify/session';
import { Type as T } from '@fastify/type-provider-typebox';
import axios, { type AxiosResponse } from 'axios';
import { RedisStore } from 'connect-redis';
import type {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
  HookHandlerDoneFunction,
} from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { createClient } from 'redis';

import { env } from '@/config';
import {
  UserResponseSchema,
  type User as TwitchUser,
} from '@/shared/twitch/types/api';

declare module 'fastify' {
  interface FastifyInstance {
    twitchOAuth2: OAuth2Namespace;
  }

  interface FastifyRequest {
    /** Only initialized if user has a valid session.
     *  Handlers using this field should add the requireAuth
     *  middleware to the onRequest hook to ensure user is not
     *  undefined.
     */
    user: SessionProfile;
  }

  interface Session {
    user: SessionProfile;
  }
}

export interface SessionProfile {
  twitch_id: string;
  name: string;
  profileImageUrl: string;
}

const auth: FastifyPluginAsync = async (fastify) => {
  await registerSession(fastify);
  registerAuth(fastify);
};

export default fastifyPlugin(auth, {
  name: 'auth',
  decorators: {
    fastify: ['repo'],
  },
  dependencies: ['repo'],
});

async function registerSession(fastify: FastifyInstance) {
  const SESSION_TTL = 5 * 24 * 60 * 60 * 1000; // 5 days

  fastify.register(fastifyCookie);

  const redisClient = createClient({ url: env.REDIS_URL });
  await redisClient.connect();
  const redisStore = new RedisStore({ client: redisClient });

  fastify.register(fastifySession, {
    secret: env.SESSION_SECRET,
    saveUninitialized: false,
    store: redisStore,
    cookieName: 'chatsTierListSessionId',
    cookie: {
      maxAge: SESSION_TTL,
      secure: true,
      sameSite: 'strict',
      domain: env.COOKIE_DOMAIN,
    },
  });

  fastify.addHook('onRequest', (req, _res, done) => {
    const user = req.session.get('user');
    if (user) {
      req.user = user;
    }
    done();
  });
}

function registerAuth(fastify: FastifyInstance) {
  fastify.register(fastifyOauth2, {
    name: 'twitchOAuth2',
    scope: [],
    credentials: {
      client: {
        id: env.TWITCH_CLIENT_ID,
        secret: env.TWITCH_CLIENT_SECRET,
      },
      auth: fastifyOauth2.TWITCH_CONFIGURATION,
    },
    tokenRequestParams: {
      client_id: env.TWITCH_CLIENT_ID,
      client_secret: env.TWITCH_CLIENT_SECRET,
    },

    startRedirectPath: '/login',
    callbackUri: env.TWITCH_CALLBACK_URL,

    cookie: {
      secure: true,
    },
  });

  fastify.get('/login/callback', async (req, res) => {
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
      res.redirect(env.REDIS_URL)
    );
  });

  fastify.get(
    '/logout',
    {
      schema: {
        summary: 'Signs out the user',
        tags: ['Auth'],
        response: {
          200: T.Null({ description: 'Successfully logged out' }),
        },
      },
    },
    async (req, res) => {
      await req.session.destroy();
      return res.code(200).send(null);
    }
  );
}

export function requireAuth(
  req: FastifyRequest,
  res: FastifyReply,
  done: HookHandlerDoneFunction
) {
  if (!req.user) {
    res.unauthorized();
    return;
  }
  done();
}

async function userProfile(token: string): Promise<TwitchUser> {
  return axios
    .get('https://api.twitch.tv/helix/users', {
      headers: {
        ['Client-Id']: env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => {
      const users = UserResponseSchema.parse(res.data);
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
