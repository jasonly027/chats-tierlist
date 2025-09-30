import Fastify, { type FastifyPluginAsync } from 'fastify';
import plugins from './plugins/_plugins.js';
import routes from './routes.ts';
import { baseLogger } from '@lib/util.js';
import {
  TypeBoxValidatorCompiler,
  type TypeBoxTypeProvider,
} from '@fastify/type-provider-typebox';

const serverPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.withTypeProvider<TypeBoxTypeProvider>();
  fastify.setValidatorCompiler(TypeBoxValidatorCompiler);

  await fastify.register(plugins);
  await fastify.register(routes);
};
export default serverPlugin;

export async function createServer() {
  const fastify = Fastify({
    loggerInstance: baseLogger,
  });
  fastify.register(serverPlugin);
  return fastify;
}
