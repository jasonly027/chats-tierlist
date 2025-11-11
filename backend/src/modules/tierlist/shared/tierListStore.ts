import { LRUCache } from 'lru-cache';

import type { TierListEditor } from '@/modules/tierlist/shared/tierListEditor';

export class TierListStore {
  private readonly cache: LRUCache<string, TierListEditor>;

  constructor(createEditor: (channelId: string) => Promise<TierListEditor>) {
    this.cache = new LRUCache({
      ignoreFetchAbort: true,

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

  getEditor(channelId: string): Promise<TierListEditor> {
    return this.cache.forceFetch(channelId);
  }
}
