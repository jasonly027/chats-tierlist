import type { FastifyInstance, FastifyRequest } from 'fastify';
import * as util from '@lib/util.js';

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
      return await fastify.chatSubscriber.subscribe(name, (msg) => {
        fastify.log.info(msg);
      });
    }
  );

  fastify.get('/subscriptions', async () => {
    return await fastify.twitch.subscriptions(util.envVar('TWITCH_TOKEN'));
  });
}
