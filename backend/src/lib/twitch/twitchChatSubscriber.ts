import type { FastifyBaseLogger } from 'fastify';
import { Mutex } from 'async-mutex';
import type { TwitchClient } from './twitchClient.ts';
import { TwitchWebSocket } from './twitchWebSocket.js';
import * as tw from './types/webSocket.ts';

export interface TwitchChatSubscriberOptions {
  client: TwitchClient;
  url?: string;
  token: string;
  logger?: FastifyBaseLogger;
}

type Connection = {
  id: string;
  socket: TwitchWebSocket;
};

type SubscriberCallbackFn = (msg: string | null) => void;

type SubscribeResult = 'ok' | 'invalid channel name' | 'chat join limit hit';

export class TwitchChatSubscriber {
  private readonly client: TwitchClient;
  private readonly url: string | undefined;

  private mutex: Mutex;
  private token: string;
  private userId: Promise<string>;
  private staleConnection: Connection | undefined;
  private chats: Array<{
    channelName: string;
    listeners: SubscriberCallbackFn[];
  }>;
  private logger: FastifyBaseLogger | undefined;

  constructor({ client, url, token, logger }: TwitchChatSubscriberOptions) {
    this.client = client;
    this.url = url;
    this.mutex = new Mutex();
    this.token = token;
    this.userId = this.client.userFromToken(this.token).then(({ id }) => id);
    this.staleConnection = undefined;
    this.chats = [];
    this.logger = logger;
  }

  subscribe(name: string, cb: SubscriberCallbackFn): Promise<SubscribeResult> {
    return this.mutex.runExclusive(async () => {
      const chat = this.chats.find(({ channelName }) => channelName === name);
      if (chat) {
        chat.listeners.push(cb);
        return 'ok';
      }

      const channel = await this.client.searchChannel(this.token, name);
      if (channel === null) {
        return 'invalid channel name';
      }

      const connection = await this.getConnection();
      await this.client.createChatMessageSubscription(this.token, {
        sessionId: connection.id,
        userId: await this.userId,
        broadcasterId: channel.id,
      });

      this.chats.push({
        channelName: channel.id,
        listeners: [cb],
      });

      return 'ok';
    });
  }

  private async getConnection(): Promise<Connection> {
    if (this.staleConnection) return this.staleConnection;

    return new Promise((resolve, reject) => {
      const socket = new TwitchWebSocket({
        ...(this.url ? { url: this.url } : {}),
        ...(this.logger
          ? { logger: this.logger.child({ module: 'TwitchWebSocket' }) }
          : {}),
      });

      socket.once('welcome', (msg) => {
        this.staleConnection = { id: msg.payload.session.id, socket };
        resolve(this.staleConnection);
      });
      socket.on('welcome', (msg) => {
        if (this.staleConnection) {
          this.staleConnection.id = msg.payload.session.id;
        }
      });
      socket.on('notification', this.onSocketNotification.bind(this));
      socket.once('error', (err) => reject(err));
      socket.once('close', () => {
        this.staleConnection = undefined;
        this.chats.forEach(({ listeners }) => {
          listeners.forEach((listener) => listener(null));
        });
        this.chats = [];
      });
    });
  }

  private onSocketNotification(msg: tw.NotifcationMessage) {
    console.log('New notification!', msg);
  }
}
