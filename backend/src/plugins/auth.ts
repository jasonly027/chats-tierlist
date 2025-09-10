import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import * as util from '@lib/util.js';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import fastifyOauth2, { type OAuth2Namespace } from '@fastify/oauth2';
import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';

declare module 'fastify' {
  interface FastifyInstance {
    twitchOAuth2: OAuth2Namespace;
  }

  interface FastifyRequest {
    user: SessionProfile | undefined;
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
  if (!fastify.hasDecorator('twitch')) {
    throw new Error('Required plugin "twitch" is not registered');
  }
  if (!fastify.hasDecorator('repo')) {
    throw new Error('Required plugin "repo" is not registered');
  }

  await registerSession(fastify);
  await registerAuth(fastify);
};

export default fastifyPlugin(auth);

async function registerSession(fastify: FastifyInstance) {
  const REDIS_URL = util.envVar('REDIS_URL');
  const SESSION_SECRET = util.envVar('SESSION_SECRET');
  const SESSION_TTL = 5 * 24 * 60 * 60 * 1000; // 5 days in ms

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

  fastify.addHook('preHandler', async (req) => {
    req.user = req.session.get('user');
  });
}

async function registerAuth(fastify: FastifyInstance) {
  const CLIENT_ID = util.envVar('TWITCH_CLIENT_ID');
  const CLIENT_SECRET = util.envVar('TWITCH_CLIENT_SECRET');
  const CALLBACK_URL = util.envVar('TWITCH_CALLBACK_URL');

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

    const user = await fastify.twitch.userFromToken(token.access_token);
    fastify.twitch.revoke(token.access_token);

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
