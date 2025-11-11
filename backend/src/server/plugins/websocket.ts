import fastifyWebsocket from '@fastify/websocket';
import type { FastifyPluginAsync } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import type { WebSocket } from 'ws';

import { baseLogger } from '@/shared/util';

const logger = baseLogger.child({ module: 'WebSocket' });

const websocket: FastifyPluginAsync = async (fastify) => {
  fastify.register(fastifyWebsocket);
  await fastify.after();

  const wss = fastify.websocketServer;
  wss.on('connection', (socket: WebSocketWithAlive) => {
    socket.isAlive = true;
    socket.on('pong', function (this: WebSocketWithAlive) {
      this.isAlive = true;
    });
  });

  // On each check, close clients that did not pong
  // the ping from the last check.
  const PING_CHECK = 10 * 1000; // 10 secs
  const pingInterval = setInterval(() => {
    for (const client of wss.clients) {
      const socket: WebSocketWithAlive = client;

      if (!socket.isAlive) {
        logger.info('Closing socket due to missing pong frame');
        socket.close(1002, 'Missed pong frame');
        continue;
      }

      socket.isAlive = false;
      socket.ping();
    }
  }, PING_CHECK);

  wss.on('close', () => {
    clearInterval(pingInterval);
  });
};

export default fastifyPlugin(websocket, {
  name: 'websocket',
});

interface WebSocketWithAlive extends WebSocket {
  isAlive?: boolean;
}
