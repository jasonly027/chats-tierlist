import type { FastifyPluginAsync } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { TwitchClient } from '@lib/twitch/twitchClient.js';
import * as util from '@lib/util.js';

declare module 'fastify' {
  interface FastifyInstance {
    twitch: TwitchClient;
  }
}

const twitch: FastifyPluginAsync = async (fastify) => {
  const client = new TwitchClient(util.envVar('TWITCH_CLIENT_ID'));
  fastify.decorate('twitch', client);
};

export default fastifyPlugin(twitch, {
  name: 'twitch',
});
