import Fastify from 'fastify';
import Autoload from '@fastify/autoload';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Repo from '@plugins/repo.js';
import Twitch from '@plugins/twitch.js';
import Auth from '@plugins/auth.js';
import fastifySensible from '@fastify/sensible';

const fastify = Fastify({
  logger: true,
  disableRequestLogging: true
});

fastify.register(fastifySensible);
fastify.register(Repo);
fastify.register(Twitch);
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

fastify.listen({ port: 3000 }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
