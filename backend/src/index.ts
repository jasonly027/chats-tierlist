import Fastify from 'fastify';
import plugins from './plugins/_plugins.js';
import routes from './routes/_routes.ts';
import { baseLogger } from './lib/util.ts';

const fastify = Fastify({
  loggerInstance: baseLogger,
});

fastify.register(plugins);
fastify.register(routes);

fastify.listen({ port: 3000 }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
