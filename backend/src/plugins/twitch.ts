import type { FastifyPluginAsync } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { TwitchClient } from '../lib/twitchClient.ts';
import * as util from '../lib/util.ts';

declare module 'fastify' {
  interface FastifyInstance {
    twitch: TwitchClient;
  }
}

const twitch: FastifyPluginAsync = async (fastify) => {
  const client = new TwitchClient(util.envVar('TWITCH_CLIENT_ID'));
  fastify.decorate('twitch', client);
};

export default fastifyPlugin(twitch);
