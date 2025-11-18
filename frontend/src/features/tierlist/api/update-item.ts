import { produce } from 'immer';

import { useTierList } from '@/features/tierlist/hooks/use-tier-list';
import { useUpdateItem as useUpdateItemApi } from '@/lib/gen/endpoints/tier-list/tier-list';

export function useUpdateItem() {
  const { queryKey } = useTierList();

  return useUpdateItemApi({
    mutation: {
      onMutate({ id, data }, { client }) {
        const { tierList } = client.getQueryData(queryKey) ?? {};
        const prevItem = tierList?.items[id];
        if (!tierList || !prevItem) throw new ReferenceError('Item not found');
        const prevVersion = tierList.version;

        const nextVersion = prevVersion + 1;
        client.setQueryData(queryKey, (prev) => {
          const tierList = produce(prev?.tierList, (tierList) => {
            const item = tierList?.items[id];
            if (!tierList || !item) return;

            if (data.name !== undefined) {
              item.name = data.name;
            }
            if (data.image_url !== undefined) {
              item.imageUrl = data.image_url;
            }
            tierList.version = nextVersion;
          });

          return {
            ...prev,
            tierList,
          };
        });

        return { prevItem, prevVersion, nextVersion };
      },

      onError(_error, { data }, onMutateResult, context) {
        if (!onMutateResult) return;
        const { prevItem, prevVersion, nextVersion } = onMutateResult;

        context.client.setQueryData(queryKey, (prev) => {
          const tierList = produce(prev?.tierList, (tierList) => {
            const item = tierList?.items[prevItem.id];
            if (!tierList || !item) return;

            if (data.name !== undefined) {
              item.name = prevItem.name;
            }
            if (data.image_url !== undefined) {
              item.imageUrl = prevItem.imageUrl;
            }
            if (tierList.version === nextVersion) {
              tierList.version = prevVersion;
            }
          });

          return {
            ...prev,
            tierList,
          };
        });
      },
    },
  });
}
