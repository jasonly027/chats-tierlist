import path from 'path';

import autoLoad from '@fastify/autoload';
import { TypeBoxValidatorCompiler } from '@fastify/type-provider-typebox';
import { FastifyPluginCallback } from 'fastify';

import routes from '@/routes';

const serverPlugin: FastifyPluginCallback = (fastify) => {
  fastify.setValidatorCompiler(TypeBoxValidatorCompiler);

  fastify.register(autoLoad, {
    dir: path.join(__dirname, 'plugins'),
  });

  fastify.register(routes);
};
export default serverPlugin;
