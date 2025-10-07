import { Type as T } from 'typebox';

import { requireAuth } from '@/server/plugins/auth';
import { Channel } from '@/shared/twitch/models';

export default function (fastify: FastifyTypeBox) {
  fastify.get('/', { onRequest: requireAuth }, (req) => {
    return `Hello World ${JSON.stringify(req.user)}`;
  });

  fastify.get(
    '/subscribe',
    {
      schema: {
        querystring: T.Object({
          name: T.String({ minLength: 1 }),
        }),
      },
    },
    async (req) => {
      const { name } = req.query;

      const ch = await fastify.twitch.client.searchChannel(name);
      if (!ch) return 'unknown channel';
      const channel = new Channel(ch);

      return fastify.tierlist.listener.listen(channel);
    }
  );

  fastify.get('/subscriptions', async () => {
    return await fastify.twitch.client.subscriptions();
  });

  fastify.get('/revoke', async () => {
    const res = await fastify.twitch.client.revoke();
    fastify.log.info({ res });
    return 'ok';
  });
}
