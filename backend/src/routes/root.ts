import type { FastifyInstance, FastifyRequest } from 'fastify';
import * as util from '@lib/util.js';
import { Channel } from '@lib/twitch/models.js';

export default function (fastify: FastifyInstance) {
  fastify.get('/', async (req) => {
    return `Hello World ${JSON.stringify(req.user)}`;
  });

  fastify.get(
    '/subscribe',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
          required: ['name'],
        },
      },
    },
    async (req: FastifyRequest<{ Querystring: { name: string } }>) => {
      const { name } = req.query;
      const token = util.envVar('TWITCH_TOKEN');

      const ch = await fastify.twitch.searchChannel(token, name);
      if (!ch) return 'unknown channel';
      const channel = new Channel(ch);

      return fastify.tierlist.listen(channel);
    }
  );

  fastify.get('/subscriptions', async () => {
    return await fastify.twitch.subscriptions(util.envVar('TWITCH_TOKEN'));
  });
}
