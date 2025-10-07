import fastifyCookie from '@fastify/cookie';
import fastifyOauth2, { type OAuth2Namespace } from '@fastify/oauth2';
import fastifySession from '@fastify/session';
import { RedisStore } from 'connect-redis';
import type {
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
  HookHandlerDoneFunction,
} from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { createClient } from 'redis';

import { env } from '@/config';

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
  // Register cookie
  fastify.register(fastifyCookie);

  // Register session
  {
    const SESSION_TTL = 5 * 24 * 60 * 60 * 1000; // 5 days

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

  // Register OAuth
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

    tags: ['Auth'],

    cookie: {
      secure: true,
    },
  });
};

export default fastifyPlugin(auth, {
  name: 'auth',
});

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
