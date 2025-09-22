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
import { baseLogger } from '@lib/util.js';
import type { Channel } from './models.ts';

const logger = baseLogger.child({ module: 'TwitchChatSubscriber' });

export type SubscriberEvent =
  | { type: 'message'; event: ChatMessageEvent }
  | { type: 'close' };

export type SubscriberCallbackFn = (msg: SubscriberEvent) => void;

export interface TwitchChatSubscriberOptions {
  client: TwitchClient;
  createSocket: () => TwitchWebSocket;
}

export class TwitchChatSubscriber {
  private readonly client: TwitchClient;

  private mutex: Mutex;
  private createSocket: () => TwitchWebSocket;
  private staleConnection: Connection | undefined;
  private broadcasts: Broadcast[];

  constructor({ client, createSocket }: TwitchChatSubscriberOptions) {
    this.client = client;
    this.mutex = new Mutex();
    this.createSocket = createSocket;
    this.broadcasts = [];
  }

  /**
   * @throws {Error} when socket fails to connect.
   * @throws {AxiosError} when subscribe fails for reasons other than join limit.
   */
  subscribe(channel: Channel, cb: SubscriberCallbackFn): Promise<boolean> {
    return this.mutex.runExclusive(async () => {
      const bd = this.findBroadcastByName(channel.name());
      if (bd) {
        bd.addListener(cb);
        return true;
      }

      const connection = await this.getConnection();
      const res = await this.client
        .createChatMessageSubscription({
          sessionId: connection.id,
          broadcasterId: channel.id(),
        })
        .catch((err: AxiosError) => {
          // Join limit hit(?)
          if (err.status === 429) {
            logger.warn({ err }, 'Chat join limit');
            return undefined;
          }
          throw err;
        });
      if (res === undefined) {
        return false;
      }

      this.broadcasts.push(new Broadcast(channel, res.id, [cb]));
      logger.info({ channel }, 'Subscribed to broadcast');

      return true;
    });
  }

  unsubscribe(cb: SubscriberCallbackFn): Promise<void> {
    return this.mutex.runExclusive(async () => {
      const broadcast = this.findBroadcastWithCallback(cb);
      if (!broadcast) return;
      broadcast.removeListener(cb);
      if (broadcast.hasListeners()) return;

      this.removeBroadcast(broadcast);

      await this.client
        .deleteChatMessageSubscription(broadcast.subscriptionId)
        .catch((err) => logger.error({ err }, 'Failed to delete subscription'));

      logger.info({ broadcast }, 'Unsubscribed from broadcast');
    });
  }

  /**
   * @throws {Error} if underlying socket throws before initial connection.
   */
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
      socket.once('error', (err) => reject(err));
      socket.on('notification', this.onNotification.bind(this));
      socket.on('revocation', this.onRevocation.bind(this));
      socket.once('close', this.onClose.bind(this));
    });
  }

  private onNotification(msg: NotifcationMessage): void {
    const event = ChatMessageEventSchema.parse(msg.payload.event);
    this.findBroadcastByName(event.broadcaster_user_login)?.messageAll({
      type: 'message',
      event,
    });
  }

  private onRevocation(msg: RevocationMessage): void {
    this.mutex.runExclusive(() => {
      const subscriptionId = msg.payload.subscription.id;
      const broadcast = this.findBroadcastBySubscriptionId(subscriptionId);
      if (!broadcast) {
        logger.warn(
          { subscriptionId },
          "Broadcast to notify of revocation wasn't found"
        );
        return;
      }

      broadcast.messageAll({ type: 'close' });
      this.removeBroadcast(broadcast);
    });
  }

  private onClose(): void {
    this.mutex.runExclusive(() => {
      this.staleConnection = undefined;
      this.broadcasts.forEach((bd) => bd.messageAll({ type: 'close' }));
      this.broadcasts = [];
    });
  }

  private findBroadcastByName(name: string): Broadcast | undefined {
    return this.broadcasts.find((bd) => bd.channel.name() === name);
  }

  private findBroadcastWithCallback(
    cb: SubscriberCallbackFn
  ): Broadcast | undefined {
    return this.broadcasts.find((bd) => bd.hasListener(cb));
  }

  private findBroadcastBySubscriptionId(id: string): Broadcast | undefined {
    return this.broadcasts.find((bd) => bd.subscriptionId === id);
  }

  private removeBroadcast(broadcast: Broadcast): void {
    const idx = this.broadcasts.indexOf(broadcast);
    if (idx !== -1) this.broadcasts.splice(idx, 1);
  }
}

interface Connection {
  id: string;
  socket: TwitchWebSocket;
}

class Broadcast {
  readonly channel: Channel;
  readonly subscriptionId: string;
  private readonly listeners: SubscriberCallbackFn[];

  constructor(
    channel: Channel,
    subscriptionId: string,
    listeners: SubscriberCallbackFn[]
  ) {
    this.channel = channel;
    this.subscriptionId = subscriptionId;
    this.listeners = listeners;
  }

  addListener(cb: SubscriberCallbackFn): void {
    this.listeners.push(cb);
  }

  removeListener(cb: SubscriberCallbackFn): void {
    const idx = this.listeners.indexOf(cb);
    if (idx !== -1) this.listeners.splice(idx);
  }

  hasListener(cb: SubscriberCallbackFn): boolean {
    return this.listeners.find((listener) => listener === cb) !== undefined;
  }

  hasListeners(): boolean {
    return this.listeners.length !== 0;
  }

  messageAll(msg: SubscriberEvent): void {
    this.listeners.forEach((cb) => cb(msg));
  }
}
