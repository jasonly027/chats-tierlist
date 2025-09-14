import { TwitchWebSocket } from '@src/lib/twitch/twitchWebSocket.js';
import pino from 'pino';

describe('TwitchWebSocket', function () {
  const logger = pino({level: 'debug'});

  it('should reconnect when prompted by external ws server', function (_done) {
    this.timeout(1000 * 60 * 5);

    new TwitchWebSocket({
      url: 'ws://localhost:8080/ws',
      logger,
    });
  });
});
