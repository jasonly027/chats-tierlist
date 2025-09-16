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
        editor.stopAutoSave();
        editor.save();
      },
    });
  }

  update(channel: Channel, userId: string, message: string) {
    this.cache
      .fetch(channel.id(), { context: channel })
      .then((editor) => editor?.vote(userId, message));
  }
}
