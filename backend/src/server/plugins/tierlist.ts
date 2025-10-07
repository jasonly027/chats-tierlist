import type { FastifyPluginCallback } from 'fastify';
import fastifyPlugin from 'fastify-plugin';

import { TierListEditor } from '@/modules/tierlist/shared/tierListEditor';
import { TierListListener } from '@/modules/tierlist/shared/tierListListener';
import { TierListStore } from '@/modules/tierlist/shared/tierListStore';
import { TwitchChatSubscriber } from '@/shared/twitch/twitchChatSubscriber';
import { TwitchWebSocket } from '@/shared/twitch/twitchWebSocket';

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
