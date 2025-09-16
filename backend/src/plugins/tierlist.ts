import * as util from '@lib/util.js';
import type { FastifyPluginAsync } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { TwitchChatSubscriber } from '@lib/twitch/twitchChatSubscriber.js';
import { TwitchWebSocket } from '@lib/twitch/twitchWebSocket.js';
import { TierListManager } from '@lib/tierlist/tierListManager.js';
import { TierListEditor } from '@lib/tierlist/tierListEditor.js';

declare module 'fastify' {
  interface FastifyInstance {
    tierlist: TierListManager;
  }
}

const tierlist: FastifyPluginAsync = async (fastify) => {
  const token = util.envVar('TWITCH_TOKEN');

  const subscriber = new TwitchChatSubscriber({
    client: fastify.twitch,
    token,
    createSocket() {
      return new TwitchWebSocket('wss://eventsub.wss.twitch.tv/ws');
    },
  });
  const editor = new TierListEditor();
  const tierlist = new TierListManager(editor, subscriber);

  fastify.decorate('tierlist', tierlist);
};

export default fastifyPlugin(tierlist, {
  name: 'tierlist',
  decorators: {
    fastify: ['twitch'],
  },
  dependencies: ['twitch'],
});
