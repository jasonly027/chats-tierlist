import Fastify from 'fastify';

import { baseLogger } from '@/lib/util';
import serverPlugin from '@/server';

async function init() {
  const server = Fastify({
    loggerInstance: baseLogger,
  });
  await server.register(serverPlugin);

  server.listen({ port: 3000 }, (err) => {
    if (err) {
      server.log.error(err);
      process.exit(1);
    }
  });
}
init().catch((err) => {
  throw err;
});
