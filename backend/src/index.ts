import Fastify from 'fastify';
import autoload from '@fastify/autoload';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fastify = Fastify({
  logger: true,
});

fastify.register(autoload, {
  dir: join(__dirname, 'routes'),
});

fastify.listen({ port: 3000 }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`Server listening on ${address}`);
});
