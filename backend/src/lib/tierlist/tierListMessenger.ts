import type { TierListStore } from './tierListStore.ts';
import type { Channel } from '@lib/twitch/models.js';
import {
  TwitchChatSubscriber,
  type SubscriberCallbackFn,
} from '@lib/twitch/twitchChatSubscriber.js';
import { baseLogger } from '@lib/util.js';
import { Mutex } from 'async-mutex';

const logger = baseLogger.child({ module: 'TierListManager' });

export class TierListMessenger {
  private readonly editor: TierListStore;
  private readonly subscriber: TwitchChatSubscriber;
  private readonly broadcasts: Broadcast[];
  private readonly mutex: Mutex;

  constructor(editor: TierListStore, subscriber: TwitchChatSubscriber) {
    this.editor = editor;
    this.subscriber = subscriber;
    this.broadcasts = [];
    this.mutex = new Mutex();
  }

  async listen(channel: Channel): Promise<boolean> {
    return this.mutex.runExclusive(async () => {
      const bd = this.findBroadcast(channel);
      if (bd) {
        bd.lastKeepAlive = Date.now();
        return true;
      }

      const broadcast = new Broadcast(channel, (msg) => {
        if (msg.type === 'message') {
          this.editor.update(
            channel,
            msg.event.chatter_user_id,
            msg.event.message.text
          );
        } else {
          this.removeBroadcast(broadcast);
        }
      });

      const success = await this.subscriber.subscribe(channel, broadcast.cb);
      if (!success) {
        return false;
      }

      this.addBroadcast(broadcast);
      return true;
    });
  }

  private findBroadcast(channel: Channel): Broadcast | undefined {
    return this.broadcasts.find((bd) => bd.channel.name() === channel.name());
  }

  private addBroadcast(broadcast: Broadcast): void {
    this.startBroadcastAliveCheck(broadcast);
    this.broadcasts.push(broadcast);
  }

  private removeBroadcast(broadcast: Broadcast): void {
    this.mutex.runExclusive(async () => {
      const idx = this.broadcasts.indexOf(broadcast);
      if (idx !== -1) this.broadcasts.splice(idx, 1);
      await this.subscriber.unsubscribe(broadcast.cb);
    });
  }

  private startBroadcastAliveCheck(broadcast: Broadcast): void {
    const CHECK_INTERVAL = 30 * 1000; // 30 seconds
    const ALIVE_TIMEOUT = 100 * 1000; // 100 seconds

    const interval = setInterval(() => {
      if (Date.now() - broadcast.lastKeepAlive > ALIVE_TIMEOUT) {
        logger.info(
          'No keep-alive for broadcast received. Removing broadcast...'
        );
        this.removeBroadcast(broadcast);
        clearInterval(interval);
      }
    }, CHECK_INTERVAL);
  }
}

class Broadcast {
  readonly channel: Channel;
  readonly cb: SubscriberCallbackFn;
  lastKeepAlive: number;

  constructor(channel: Channel, cb: SubscriberCallbackFn) {
    this.channel = channel;
    this.cb = cb;
    this.lastKeepAlive = Date.now();
  }
}
