import type { Channel } from '@lib/twitch/models.js';
import { baseLogger } from '@lib/util.js';

const logger = baseLogger.child({ module: 'TierListEditor' });

export class TierListEditor {
  update(channel: Channel, userId: string, message: string) {
    logger.info(`${channel.name()}:${userId}:${message}`);
  }
}
