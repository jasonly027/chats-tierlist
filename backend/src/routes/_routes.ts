import type { FastifyPluginCallback } from 'fastify';
import root from './root.ts';
import tierlist from './tierlist.ts';

const routes: FastifyPluginCallback = (fastify) => {
  fastify.register(root);
  fastify.register(tierlist, { prefix: '/tierlist' });
};

export default routes;
