import type { TierListEditor } from './tierListEditor.ts';
import type { Channel } from '@lib/twitch/models.js';
import {
  TwitchChatSubscriber,
  type SubscriberCallbackFn,
} from '@lib/twitch/twitchChatSubscriber.js';
import { baseLogger } from '@lib/util.js';

const logger = baseLogger.child({ module: 'TierListManager' });

export class TierListManager {
  private readonly editor: TierListEditor;
  private readonly subscriber: TwitchChatSubscriber;
  private readonly broadcasts: Broadcast[];

  constructor(editor: TierListEditor, subscriber: TwitchChatSubscriber) {
    this.editor = editor;
    this.subscriber = subscriber;
    this.broadcasts = [];
  }

  async listen(channel: Channel): Promise<boolean> {
    const bd = this.findBroadcast(channel);
    if (bd) {
      bd.isAlive = true;
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
      return success;
    }

    this.addBroadcast(broadcast);
    return true;
  }

  private findBroadcast(channel: Channel): Broadcast | undefined {
    return this.broadcasts.find((bd) => bd.channel.name() === channel.name());
  }

  private addBroadcast(broadcast: Broadcast): void {
    this.startBroadcastAliveCheck(broadcast);
    this.broadcasts.push(broadcast);
  }

  private removeBroadcast(broadcast: Broadcast): void {
    const idx = this.broadcasts.indexOf(broadcast);
    if (idx !== -1) this.broadcasts.splice(idx, 1);
    this.subscriber.unsubscribe(broadcast.cb);
  }

  private startBroadcastAliveCheck(broadcast: Broadcast): void {
    const ALIVE_CHECK_TIMEOUT = 100 * 1000; // 100 seconds

    const interval = setInterval(() => {
      if (!broadcast.isAlive) {
        logger.info(
          'No keep-alive for broadcast received. Removing broadcast...'
        );
        this.removeBroadcast(broadcast);
        clearInterval(interval);
        return;
      }
      broadcast.isAlive = false;
    }, ALIVE_CHECK_TIMEOUT);
  }
}

class Broadcast {
  readonly channel: Channel;
  readonly cb: SubscriberCallbackFn;
  isAlive: boolean;

  constructor(channel: Channel, cb: SubscriberCallbackFn) {
    this.channel = channel;
    this.cb = cb;
    this.isAlive = true;
  }
}
