import Fastify from 'fastify';

import { env } from '@/config';
import serverPlugin from '@/server';
import { baseLogger } from '@/shared/util';

async function init() {
  const server = Fastify({
    loggerInstance: baseLogger,
  });
  await server.register(serverPlugin);

  server.listen(
    {
      port: 3000,
      host: env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1',
    },
    (err) => {
      if (err) {
        server.log.error(err);
        process.exit(1);
      }
    }
  );
}
init().catch((err) => {
  throw err;
});
