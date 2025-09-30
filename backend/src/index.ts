import { createServer } from './server.ts';

const server = await createServer();

server.listen({ port: 3000 }, (err) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
});
