import type { FastifyPluginCallback } from 'fastify';
import root from './root.ts';

const routes: FastifyPluginCallback = (fastify) => {
  fastify.register(root, { prefix: '/' });
};

export default routes;
