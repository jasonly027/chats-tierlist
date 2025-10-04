import type { FastifyPluginCallback } from 'fastify';
import fastifyPlugin from 'fastify-plugin';

import { TierListEditor } from '@lib/tierlist/tierListEditor.js';
import { TierListListener } from '@lib/tierlist/tierListListener.js';
import { TierListStore } from '@lib/tierlist/tierListStore.js';
import { TwitchChatSubscriber } from '@lib/twitch/twitchChatSubscriber.js';
import { TwitchWebSocket } from '@lib/twitch/twitchWebSocket.js';

declare module 'fastify' {
  interface FastifyInstance {
    tierlist: {
      store: TierListStore;
      listener: TierListListener;
    };
  }
}

const tierlist: FastifyPluginCallback = (fastify) => {
  const createEditor = async (channelId: string) => {
    const tierList = (await fastify.repo.getTierList(channelId)) ?? {
      tiers: [],
      items: {},
      isVoting: false,
      focus: null,
      version: Date.now(),
    };
    return new TierListEditor(fastify.repo, channelId, tierList);
  };
  const store = new TierListStore(createEditor);

  const subscriber = new TwitchChatSubscriber({
    client: fastify.twitch.client,
    createSocket() {
      return new TwitchWebSocket('wss://eventsub.wss.twitch.tv/ws');
    },
  });
  const listener = new TierListListener(store, subscriber);

  fastify.decorate('tierlist', {
    store,
    listener,
  });
};

export default fastifyPlugin(tierlist, {
  name: 'tierlist',
  decorators: {
    fastify: ['twitch', 'repo'],
  },
  dependencies: ['twitch', 'repo'],
});
