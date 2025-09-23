import { baseLogger } from '@lib/util.js';
import { LRUCache } from 'lru-cache';
import type { TierListEditor } from './tierListEditor.ts';

const logger = baseLogger.child({ module: 'TierListEditor' });

export class TierListStore {
  private readonly cache: LRUCache<string, TierListEditor>;

  constructor(createEditor: (channelId: string) => Promise<TierListEditor>) {
    this.cache = new LRUCache({
      maxSize: 100,
      sizeCalculation: () => {
        return 1;
      },

      async fetchMethod(key, _value) {
        try {
          return await createEditor(key);
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

  getEditor(channelId: string): Promise<TierListEditor | undefined> {
    return this.cache.fetch(channelId).catch((err) => {
      logger.error({ err }, 'Failed to fetch editor');
      return undefined;
    });
  }
}
