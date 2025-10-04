import fastifySensible from '@fastify/sensible';
import { FastifyPluginCallback } from 'fastify';
import fastifyPlugin from 'fastify-plugin';

const plugin: FastifyPluginCallback = (fastify) => {
  fastify.register(fastifySensible, { sharedSchemaId: 'HttpError' });
};

export default fastifyPlugin(plugin, { name: 'sensible' });
