import { FastifyPluginCallback } from 'fastify';
import fastifyHealthcheck from 'fastify-healthcheck';
import fastifyPlugin from 'fastify-plugin';

const healthcheck: FastifyPluginCallback = (fastify) => {
  fastify.register(fastifyHealthcheck);
};

export default fastifyPlugin(healthcheck, {
  name: 'healthcheck',
});
