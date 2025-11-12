import path from 'path';

import autoLoad from '@fastify/autoload';
import { TypeBoxValidatorCompiler } from '@fastify/type-provider-typebox';
import { FastifyPluginCallback } from 'fastify';

const serverPlugin: FastifyPluginCallback = (fastify) => {
  // Use TypeBox for request schemas
  fastify.setValidatorCompiler(TypeBoxValidatorCompiler);

  // Register every plugin in plugins dir
  fastify.register(autoLoad, {
    dir: path.join(__dirname, 'plugins'),
  });

  // Register every module in modules dir
  fastify.register(autoLoad, {
    dir: path.join(__dirname, '..', 'modules'),
    dirNameRoutePrefix: false,
    matchFilter: (path) => /\.module\.(js|ts)$/.test(path),
  });
};

export default serverPlugin;
