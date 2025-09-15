import { Mutex } from 'async-mutex';
import { AxiosError } from 'axios';
import {
  ChatMessageEventSchema,
  type ChatMessageEvent,
  type NotifcationMessage,
  type RevocationMessage,
} from './types/webSocket.ts';
import type { TwitchClient } from './twitchClient.ts';
import { TwitchWebSocket } from './twitchWebSocket.ts';
import { logger as baseLogger } from '@lib/util.js';

const logger = baseLogger.child({ module: 'TwitchChatSubscriber' });

export type SubscribeResult =
  | 'ok'
  | 'invalid channel name'
  | 'chat join limit hit';

export interface TwitchChatSubscriberOptions {
  client: TwitchClient;
  token: string;
  createSocket: () => TwitchWebSocket;
}

export class TwitchChatSubscriber {
  private readonly client: TwitchClient;

  private mutex: Mutex;
  private token: string;
  private createSocket: () => TwitchWebSocket;
  private userId: Promise<string>;
  private staleConnection: Connection | undefined;
  private broadcasts: Broadcast[];

  constructor({ client, token, createSocket }: TwitchChatSubscriberOptions) {
    this.client = client;
    this.mutex = new Mutex();
    this.token = token;
    this.createSocket = createSocket;
    this.userId = this.client.userFromToken(this.token).then(({ id }) => id);
    this.staleConnection = undefined;
    this.broadcasts = [];
  }

  subscribe(name: string, cb: SubscriberCallbackFn): Promise<SubscribeResult> {
    return this.mutex.runExclusive(async () => {
      const broadcast = this.findBroadcast(name);
      if (broadcast) {
        broadcast.addListener(cb);
        return 'ok';
      }

      const channel = await this.client.searchChannel(this.token, name);
      if (channel === null) {
        return 'invalid channel name';
      }

      const connection = await this.getConnection();
      await this.client
        .createChatMessageSubscription(this.token, {
          sessionId: connection.id,
          userId: await this.userId,
          broadcasterId: channel.id,
        })
        .catch((err: AxiosError) => {
          // Already subscribed
          if (err.status === 409) {
            return 'ok';
          }
          return err;
        });

      this.broadcasts.push(
        new Broadcast({
          displayName: channel.display_name,
          login: channel.broadcaster_login,
          listeners: [cb],
        })
      );

      return 'ok';
    });
  }

  private findBroadcast(query: string): Broadcast | undefined {
    const name = query.toLowerCase();
    return this.broadcasts.find(
      (bd) => bd.displayName === name || bd.login === name
    );
  }

  private async getConnection(): Promise<Connection> {
    if (this.staleConnection) return this.staleConnection;

    return new Promise((resolve, reject) => {
      const socket = this.createSocket();

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

        for (const bd of this.broadcasts) {
          bd.broadcast('close');
        }
        this.broadcasts = [];
      });
    });
  }

  private onSocketNotification(msg: NotifcationMessage): void {
    const event = ChatMessageEventSchema.parse(msg.payload.event);
    const bd = this.findBroadcast(event.broadcaster_user_name);
    if (bd) bd.broadcast(event);
  }
}

interface Connection {
  id: string;
  socket: TwitchWebSocket;
}

type SubscriberCallbackFn = (
  msg: ChatMessageEvent | RevocationMessage | 'close'
) => void;

interface BroadcastOptions {
  login: string;
  displayName: string;
  listeners: SubscriberCallbackFn[];
}

class Broadcast {
  readonly login: string;
  readonly displayName: string;
  private listeners: SubscriberCallbackFn[];

  constructor({ login, displayName, listeners }: BroadcastOptions) {
    this.login = login;
    this.displayName = displayName;
    this.listeners = listeners;
  }

  addListener(cb: SubscriberCallbackFn): void {
    this.listeners.push(cb);
  }

  broadcast(msg: Parameters<SubscriberCallbackFn>[0]): void {
    for (const listener of this.listeners) {
      try {
        listener(msg);
      } catch (err) {
        logger.error({ err }, 'Sending message to listener threw an error');
      }
    }
  }
}
