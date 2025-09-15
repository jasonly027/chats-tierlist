import * as util from '@lib/util.js';
import type { FastifyPluginAsync } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { TwitchChatSubscriber } from '@src/lib/twitch/twitchChatSubscriber.js';
import { TwitchWebSocket } from '@src/lib/twitch/twitchWebSocket.js';

declare module 'fastify' {
  interface FastifyInstance {
    chatSubscriber: TwitchChatSubscriber;
  }
}

const chatSubscriber: FastifyPluginAsync = async (fastify) => {
  const token = util.envVar('TWITCH_TOKEN');

  const subscriber = new TwitchChatSubscriber({
    client: fastify.twitch,
    token,
    createSocket() {
      return new TwitchWebSocket('wss://eventsub.wss.twitch.tv/ws');
    },
  });

  fastify.decorate('chatSubscriber', subscriber);
};

export default fastifyPlugin(chatSubscriber, {
  name: 'chatSubscriber',
  decorators: {
    fastify: ['twitch'],
  },
  dependencies: ['twitch'],
});
