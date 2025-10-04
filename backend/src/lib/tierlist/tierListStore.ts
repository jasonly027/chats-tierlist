import { LRUCache } from 'lru-cache';

import type { TierListEditor } from '@/lib/tierlist/tierListEditor';

export class TierListStore {
  private readonly cache: LRUCache<string, TierListEditor>;

  constructor(createEditor: (channelId: string) => Promise<TierListEditor>) {
    this.cache = new LRUCache({
      maxSize: 100,
      sizeCalculation: () => {
        return 1;
      },

      async fetchMethod(key, _value) {
        return await createEditor(key);
      },

      dispose(editor) {
        void editor.save();
      },
    });
  }

  getEditor(channelId: string): Promise<TierListEditor | undefined> {
    return this.cache.fetch(channelId);
  }
}
