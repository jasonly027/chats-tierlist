import type { Channel } from '@lib/twitch/models.js';
import { baseLogger } from '@lib/util.js';
import { LRUCache } from 'lru-cache';
import type { TierListEditor } from './tierListEditor.ts';

const logger = baseLogger.child({ module: 'TierListEditor' });

export class TierListStore {
  private readonly cache: LRUCache<string, TierListEditor, Channel>;

  constructor(createEditor: (channel: Channel) => Promise<TierListEditor>) {
    this.cache = new LRUCache({
      maxSize: 100,
      sizeCalculation: () => {
        return 1;
      },

      async fetchMethod(_key, _value, { context }) {
        try {
          return await createEditor(context);
        } catch (err) {
          logger.error({ err }, 'Failed to create editor');
          throw err;
        }
      },

      dispose(editor) {
        editor.save();
      },
    });
  }

  getEditor(channel: Channel): Promise<TierListEditor | undefined> {
    return this.cache.fetch(channel.id(), { context: channel }).catch((err) => {
      logger.error({ err }, 'Failed to fetch editor');
      return undefined;
    });
  }
}
