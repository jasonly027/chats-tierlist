import type { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance) {
  fastify.get('/', async (req) => {
    return `Hello World ${JSON.stringify(req.user)}`;
  });
}
