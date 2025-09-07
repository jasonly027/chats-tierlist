import Fastify from 'fastify';
import Autoload from '@fastify/autoload';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Auth from './plugins/auth.js';

const fastify = Fastify({
  logger: true,
});

fastify.register(Auth);

fastify.register(Autoload, {
  dir: join(
    (() => {
      const __filename = fileURLToPath(import.meta.url);
      return dirname(__filename);
    })(),
    'routes'
  ),
});

fastify.listen({ port: 3000 }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`Server listening on ${address}`);
});
