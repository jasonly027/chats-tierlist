import fastifyCors from '@fastify/cors';
import { FastifyPluginCallback } from 'fastify';
import fastifyPlugin from 'fastify-plugin';

import { env } from '@/config';

const cors: FastifyPluginCallback = (fastify) => {
  fastify.register(fastifyCors, {
    origin: env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });
};

export default fastifyPlugin(cors, {
  name: 'cors',
});
