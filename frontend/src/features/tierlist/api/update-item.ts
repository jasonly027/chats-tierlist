import { produce } from 'immer';

import { useTierList } from '@/features/tierlist/hooks/use-tier-list';
import type { TierList } from '@/features/tierlist/types/tier-list';
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
        client.setQueryData(
          queryKey,
          produce((tierList: TierList | undefined) => {
            if (!tierList) return;

            const item = tierList.items[id];
            if (!item) return;

            if (data.name !== undefined) {
              item.name = data.name;
            }
            if (data.image_url !== undefined) {
              item.imageUrl = data.image_url;
            }
            tierList.version = nextVersion;

            return tierList;
          })
        );

        return { prevItem, prevVersion, nextVersion };
      },

      onError(_error, { data }, onMutateResult, context) {
        if (!onMutateResult) return;
        const { prevItem, prevVersion, nextVersion } = onMutateResult;

        context.client.setQueryData(
          queryKey,
          produce((tierList: TierList | undefined) => {
            if (!tierList) return;

            const item = tierList.items[prevItem.id];
            if (!item) return;

            if (data.name !== undefined) {
              item.name = prevItem.name;
            }
            if (data.image_url !== undefined) {
              item.imageUrl = prevItem.imageUrl;
            }
            if (tierList.version === nextVersion) {
              tierList.version = prevVersion;
            }

            return tierList;
          })
        );
      },
    },
  });
}
