import { Mutex } from 'async-mutex';

import type { TierListStore } from '@/modules/tierlist/shared/tierListStore';
import type { Channel } from '@/shared/twitch/models';
import {
  TwitchChatSubscriber,
  type SubscriberCallbackFn,
} from '@/shared/twitch/twitchChatSubscriber';
import { baseLogger } from '@/shared/util';

const logger = baseLogger.child({ module: 'TierListListener' });

export class TierListListener {
  private readonly store: TierListStore;
  private readonly subscriber: TwitchChatSubscriber;
  private readonly broadcasts: Broadcast[];
  private readonly mutex: Mutex;

  constructor(store: TierListStore, subscriber: TwitchChatSubscriber) {
    this.store = store;
    this.subscriber = subscriber;
    this.broadcasts = [];
    this.mutex = new Mutex();
  }

  /**
   * @returns true if successfully listening and false if chat join limit.
   * @throws {Error} when subscribe fails.
   */
  async listen(channel: Channel): Promise<boolean> {
    return this.mutex.runExclusive(async () => {
      const bd = this.findBroadcast(channel);
      if (bd) {
        bd.lastKeepAlive = Date.now();
        return true;
      }

      const broadcast = new Broadcast(channel, (msg) => {
        if (msg.type === 'message') {
          this.store
            .getEditor(channel.id())
            .then((editor) => {
              editor?.vote(msg.event.chatter_user_name, msg.event.message.text);
            })
            .catch((err: unknown) => {
              logger.error({ err }, 'Failed to save chatter vote');
            });
        } else {
          logger.info(
            { broadcast },
            'Removing broadcast due to close message from subscriber callback'
          );
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
    void this.mutex.runExclusive(async () => {
      this.stopBroadcastAliveCheck(broadcast);
      const idx = this.broadcasts.indexOf(broadcast);
      if (idx !== -1) this.broadcasts.splice(idx, 1);
      await this.subscriber.unsubscribe(broadcast.cb);
    });
  }

  private startBroadcastAliveCheck(broadcast: Broadcast): void {
    const CHECK_INTERVAL = 30 * 1000; // 30 seconds
    const ALIVE_TIMEOUT = 100 * 1000; // 100 seconds

    broadcast.keepAliveIntervalId = setInterval(() => {
      if (Date.now() - broadcast.lastKeepAlive > ALIVE_TIMEOUT) {
        logger.info(
          { broadcast },
          'No keep-alive for broadcast received. Removing broadcast...'
        );
        this.removeBroadcast(broadcast);
      }
    }, CHECK_INTERVAL);
  }

  private stopBroadcastAliveCheck(broadcast: Broadcast): void {
    clearInterval(broadcast.keepAliveIntervalId);
    broadcast.keepAliveIntervalId = undefined;
  }
}

class Broadcast {
  readonly channel: Channel;
  readonly cb: SubscriberCallbackFn;
  lastKeepAlive: number;
  keepAliveIntervalId: NodeJS.Timeout | undefined;

  constructor(channel: Channel, cb: SubscriberCallbackFn) {
    this.channel = channel;
    this.cb = cb;
    this.lastKeepAlive = Date.now();
  }
}
