import { produce } from 'immer';

import { useTierList } from '@/features/tierlist/hooks/use-tier-list';
import type { TierList } from '@/features/tierlist/types/tier-list';
import { useDeleteItem as useDeleteItemApi } from '@/lib/gen/endpoints/tier-list/tier-list';

export function useDeleteItem() {
  const { queryKey } = useTierList();

  return useDeleteItemApi({
    mutation: {
      onMutate({ id }, { client }) {
        const list = client.getQueryData(queryKey);
        const prevItem = list?.items[id];
        if (!list || !prevItem) throw new ReferenceError('Item not found');
        const prevVersion = list.version;

        const nextVersion = Date.now();
        client.setQueryData(
          queryKey,
          produce((tierList: TierList | undefined) => {
            if (!tierList) return;

            delete tierList.items[id];
            tierList.version = nextVersion;

            return tierList;
          })
        );

        return { prevItem, prevVersion, nextVersion };
      },

      onError(_error, { id }, onMutateResult, context) {
        if (!onMutateResult) return;
        const { prevItem, prevVersion, nextVersion } = onMutateResult;

        context.client.setQueryData(
          queryKey,
          produce((tierList: TierList | undefined) => {
            if (!tierList) return;

            tierList.items[id] = prevItem;
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
