import fastifySecureSession from '@fastify/secure-session';
import passport from '@fastify/passport';
import { FastifyPluginAsync } from 'fastify';
import { Strategy as TwitchStrategy } from 'passport-twitch-strategy';
import fastifyPlugin from 'fastify-plugin';
import * as util from '../util.js';
import { TwitchProfile, UserProfile } from '../types.js';

const fastifyPassport = passport.default;

const auth: FastifyPluginAsync = async (fastify) => {
  fastify.register(fastifySecureSession, {
    key: util.envVar('SESSION_SECRET'),
    expiry: 5 * 24 * 60 * 60, // 5 days
    cookie: {
      path: '/',
    },
  });

  fastify.register(fastifyPassport.initialize());
  fastify.register(fastifyPassport.secureSession());

  fastifyPassport.use(
    'twitch',
    new TwitchStrategy(
      {
        clientID: util.envVar('TWITCH_CLIENT_ID'),
        clientSecret: util.envVar('TWITCH_CLIENT_SECRET'),
        callbackURL: 'http://localhost:3000/auth/callback',
        scope: '',
      },
      (
        _accessToken: string,
        _refreshToken: string,
        profile: TwitchProfile,
        done: (err: unknown, user: TwitchProfile) => void
      ) => {
        done(undefined, profile);
      }
    )
  );

  fastifyPassport.registerUserSerializer<TwitchProfile, UserProfile>(
    async (twitch) => {
      return {
        id: twitch.id,
        name: twitch.displayName,
        profile_image_url: twitch.profile_image_url,
      };
    }
  );

  fastifyPassport.registerUserDeserializer<UserProfile, UserProfile>(
    async (user) => {
      return user;
    }
  );
};

export default fastifyPlugin(auth);
