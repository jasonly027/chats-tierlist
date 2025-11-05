import { produce } from 'immer';

import { useTierList } from '@/features/tierlist/hooks/use-tier-list';
import { useUpdateItem as useUpdateItemApi } from '@/lib/gen/endpoints/tier-list/tier-list';

export function useUpdateItem() {
  const { queryKey } = useTierList();

  return useUpdateItemApi({
    mutation: {
      onMutate({ id, data }, { client }) {
        const list = client.getQueryData(queryKey);
        const prevItem = list?.items[id];
        if (!list || !prevItem) throw new ReferenceError('Item not found');
        const prevVersion = list.version;

        const nextVersion = Date.now();
        client.setQueryData(queryKey, (prev) => {
          if (!prev) return;

          return produce(prev, (draft) => {
            const item = draft.items[id];
            if (!item) return;

            item.name = data.name ?? item.name;
            item.imageUrl =
              data.image_url !== undefined ? data.image_url : item.imageUrl;

            draft.version = nextVersion;
          });
        });

        return { prevItem, prevVersion, nextVersion };
      },

      onError(_error, { data }, onMutateResult, context) {
        if (!onMutateResult) return;
        const { prevItem, prevVersion, nextVersion } = onMutateResult;
        context.client.setQueryData(queryKey, (prev) => {
          if (!prev) return;

          return produce(prev, (draft) => {
            const item = draft.items[prevItem.id];
            if (!item) return;

            if (data.name !== undefined) {
              item.name = prevItem.name;
            }
            if (data.image_url !== undefined) {
              item.imageUrl = prevItem.imageUrl;
            }
            if (draft.version === nextVersion) {
              draft.version = prevVersion;
            }
          });
        });
      },
    },
  });
}
