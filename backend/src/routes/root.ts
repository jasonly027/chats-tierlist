import { Channel } from '@lib/twitch/models.js';
import { requireAuth } from '@plugins/auth.js';
import type { FastifyTypeBox } from '@lib/util.js';
import { Type as T } from '@fastify/type-provider-typebox';

export default function (fastify: FastifyTypeBox) {
  fastify.get('/', { preHandler: requireAuth }, async (req) => {
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
