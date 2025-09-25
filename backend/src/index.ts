import Fastify from 'fastify';
import plugins from './plugins/_plugins.js';
import routes from './routes/_routes.ts';
import { baseLogger } from './lib/util.ts';
import {
  TypeBoxValidatorCompiler,
  type TypeBoxTypeProvider,
} from '@fastify/type-provider-typebox';

const fastify = Fastify({
  loggerInstance: baseLogger,
}).withTypeProvider<TypeBoxTypeProvider>();
fastify.setValidatorCompiler(TypeBoxValidatorCompiler);

fastify.register(plugins);
fastify.register(routes);

fastify.listen({ port: 3000 }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
