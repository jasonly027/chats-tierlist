import type { FastifyPluginAsync } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { TwitchClient } from '@lib/twitch/twitchClient.js';
import * as util from '@lib/util.js';
import { TwitchTokenStore } from '@lib/twitch/twitchTokenStore.js';

declare module 'fastify' {
  interface FastifyInstance {
    twitch: {
      client: TwitchClient;
      tokenStore: TwitchTokenStore;
    };
  }
}

const twitch: FastifyPluginAsync = async (fastify) => {
  const client = new TwitchClient({
    clientId: util.envVar('TWITCH_CLIENT_ID'),
    clientSecret: util.envVar('TWITCH_CLIENT_SECRET'),
  });

  const tokenStore = new TwitchTokenStore(
    client,
    util.envVar('TWITCH_REFRESH_TOKEN')
  );

  fastify.decorate('twitch', { client, tokenStore });
};

export default fastifyPlugin(twitch, {
  name: 'twitch',
});
