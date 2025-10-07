import type { FastifyPluginAsync } from 'fastify';
import fastifyPlugin from 'fastify-plugin';

import { env } from '@/config';
import { TwitchClient } from '@/shared/twitch/twitchClient';
import { baseLogger } from '@/shared/util';

declare module 'fastify' {
  interface FastifyInstance {
    twitch: {
      client: TwitchClient;
    };
  }
}

const twitch: FastifyPluginAsync = async (fastify) => {
  const client = await TwitchClient.create({
    clientId: env.TWITCH_CLIENT_ID,
    clientSecret: env.TWITCH_CLIENT_SECRET,
    refreshToken: env.TWITCH_REFRESH_TOKEN,
  });

  startValidationInterval(client);

  fastify.decorate('twitch', { client });
};

export default fastifyPlugin(twitch, {
  name: 'twitch',
});

// Validates the client token immediately and continues to do so every hour.
function startValidationInterval(client: TwitchClient): void {
  const logger = baseLogger.child({ module: 'TwitchClientValidator' });

  client.validate().catch((err: unknown) => {
    logger.error({ err }, 'Initial validation failed');
    throw err;
  });

  const VALIDATE_INTERVAL = 60 * 60 * 1000; // 1 hour
  setInterval(() => {
    logger.info('Validating Twitch Token...');

    client.validate().catch((err: unknown) => {
      logger.error({ err }, 'Failed to validate token');
    });
  }, VALIDATE_INTERVAL);
}
