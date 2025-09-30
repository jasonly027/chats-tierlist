import type { FastifyPluginAsync } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { TwitchClient } from '@lib/twitch/twitchClient.js';
import { envVar, baseLogger } from '@lib/util.js';

declare module 'fastify' {
  interface FastifyInstance {
    twitch: {
      client: TwitchClient;
    };
  }
}

const twitch: FastifyPluginAsync = async (fastify) => {
  const client = await TwitchClient.create({
    clientId: envVar('TWITCH_CLIENT_ID'),
    clientSecret: envVar('TWITCH_CLIENT_SECRET'),
    refreshToken: envVar('TWITCH_REFRESH_TOKEN'),
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

  client.validate();
  const VALIDATE_INTERVAL = 60 * 60 * 1000; // 1 hour
  setInterval(() => {
    logger.info('Validating Twitch Token...');

    client.validate().catch((err) => {
      logger.error({ err }, 'Failed to validate token');
    });
  }, VALIDATE_INTERVAL);
}
