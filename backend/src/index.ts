import Fastify from 'fastify';
import plugins from './plugins/_plugins.ts';
import routes from './routes/_routes.ts';

const fastify = Fastify({
  logger: {
    level: 'debug',
  },
});

fastify.register(plugins);
fastify.register(routes);

fastify.listen({ port: 3000 }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
