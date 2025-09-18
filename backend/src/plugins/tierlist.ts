import type { FastifyPluginAsync } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { TwitchChatSubscriber } from '@lib/twitch/twitchChatSubscriber.js';
import { TwitchWebSocket } from '@lib/twitch/twitchWebSocket.js';
import { TierListListener } from '@lib/tierlist/tierListListener.js';
import { TierListStore } from '@lib/tierlist/tierListStore.js';
import { TierListEditor } from '@lib/tierlist/tierListEditor.js';
import type { Channel } from '@lib/twitch/models.js';

declare module 'fastify' {
  interface FastifyInstance {
    tierlist: {
      store: TierListStore;
      listener: TierListListener;
    };
  }
}

const tierlist: FastifyPluginAsync = async (fastify) => {
  const createEditor = async (channel: Channel) => {
    const tierList = (await fastify.repo.getTierList(channel.id())) ?? {
      tiers: [],
      items: {},
    };
    return new TierListEditor(fastify.repo, channel, tierList);
  };
  const store = new TierListStore(createEditor);

  const subscriber = new TwitchChatSubscriber({
    client: fastify.twitch.client,
    getToken() {
      return fastify.twitch.tokenStore.getToken();
    },
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
