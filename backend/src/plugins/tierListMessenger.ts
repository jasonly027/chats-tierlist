import * as util from '@lib/util.js';
import type { FastifyPluginAsync } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { TwitchChatSubscriber } from '@lib/twitch/twitchChatSubscriber.js';
import { TwitchWebSocket } from '@lib/twitch/twitchWebSocket.js';
import { TierListMessenger } from '@lib/tierlist/tierListMessenger.js';
import { TierListStore } from '@lib/tierlist/tierListStore.js';

declare module 'fastify' {
  interface FastifyInstance {
    tierListMessenger: TierListMessenger;
  }
}

const messenger: FastifyPluginAsync = async (fastify) => {
  const token = util.envVar('TWITCH_TOKEN');

  const subscriber = new TwitchChatSubscriber({
    client: fastify.twitch,
    token,
    createSocket() {
      return new TwitchWebSocket('wss://eventsub.wss.twitch.tv/ws');
    },
  });
  const editor = new TierListStore();
  const messenger = new TierListMessenger(editor, subscriber);

  fastify.decorate('tierListMessenger', messenger);
};

export default fastifyPlugin(messenger, {
  name: 'tierListMessenger',
  decorators: {
    fastify: ['twitch'],
  },
  dependencies: ['twitch'],
});
