import type {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
} from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { envVar } from '@lib/util.js';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import fastifyOauth2, { type OAuth2Namespace } from '@fastify/oauth2';
import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';
import {
  UserResponseSchema,
  type User as TwitchUser,
} from '@lib/twitch/types/api.js';
import axios, { type AxiosResponse } from 'axios';

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
  await registerAuth(fastify);
};

export default fastifyPlugin(auth, {
  name: 'auth',
  decorators: {
    fastify: ['repo'],
  },
  dependencies: ['repo'],
});

async function registerSession(fastify: FastifyInstance) {
  const REDIS_URL = envVar('REDIS_URL');
  const SESSION_SECRET = envVar('SESSION_SECRET');
  const SESSION_TTL = 5 * 24 * 60 * 60 * 1000; // 5 days

  fastify.register(fastifyCookie);

  const redisClient = createClient({ url: REDIS_URL });
  await redisClient.connect();
  const redisStore = new RedisStore({ client: redisClient });

  fastify.register(fastifySession, {
    secret: SESSION_SECRET,
    saveUninitialized: false,
    store: redisStore,
    cookie: {
      maxAge: SESSION_TTL,
      secure: process.env['NODE_ENV'] === 'production',
    },
  });

  fastify.addHook('onRequest', async (req) => {
    const user = req.session.get('user');
    if (user) {
      req.user = user;
    }
  });
}

async function registerAuth(fastify: FastifyInstance) {
  const CLIENT_ID = envVar('TWITCH_CLIENT_ID');
  const CLIENT_SECRET = envVar('TWITCH_CLIENT_SECRET');
  const CALLBACK_URL = envVar('TWITCH_CALLBACK_URL');

  fastify.register(fastifyOauth2, {
    name: 'twitchOAuth2',
    scope: [],
    credentials: {
      client: {
        id: CLIENT_ID,
        secret: CLIENT_SECRET,
      },
      auth: fastifyOauth2.fastifyOauth2.TWITCH_CONFIGURATION,
    },
    tokenRequestParams: {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    },

    startRedirectPath: '/login',
    callbackUri: CALLBACK_URL,
  });

  fastify.get('/login/callback', async (req, res) => {
    const tw = fastify.twitchOAuth2;
    const { token } = await tw.getAccessTokenFromAuthorizationCodeFlow(req);

    const user = await userProfile(token.access_token).finally(() => {
      revokeUserToken(token.access_token).catch((err) => {
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
      res.redirect('/')
    );
  });

  fastify.get('/logout', async (req, res) => {
    await req.session.destroy();
    return res.send('OK');
  });
}

export async function requireAuth(req: FastifyRequest, res: FastifyReply) {
  if (!req.user) {
    return res.unauthorized();
  }
}

const TWITCH_CLIENT_ID = envVar('TWITCH_CLIENT_ID');

async function userProfile(token: string): Promise<TwitchUser> {
  return axios
    .get('https://api.twitch.tv/helix/users', {
      headers: {
        ['Client-Id']: TWITCH_CLIENT_ID,
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
      client_id: TWITCH_CLIENT_ID,
      token: token,
    },
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );
}
