import { produce } from 'immer';

import { useTierList } from '@/features/tierlist/hooks/use-tier-list';
import { useDeleteItem as useDeleteItemApi } from '@/lib/gen/endpoints/tier-list/tier-list';

export function useDeleteItem() {
  const { queryKey } = useTierList();

  return useDeleteItemApi({
    mutation: {
      onMutate({ id }, { client }) {
        const { tierList } = client.getQueryData(queryKey) ?? {};
        const prevItem = tierList?.items[id];
        if (!tierList || !prevItem) throw new ReferenceError('Item not found');
        const prevVersion = tierList.version;

        const nextVersion = Date.now();
        client.setQueryData(queryKey, (prev) => {
          const tierList = produce(prev?.tierList, (tierList) => {
            if (!tierList) return;

            delete tierList.items[id];
            tierList.version = nextVersion;
          });

          return {
            ...prev,
            tierList,
          };
        });

        return { prevItem, prevVersion, nextVersion };
      },

      onError(_error, { id }, onMutateResult, context) {
        if (!onMutateResult) return;
        const { prevItem, prevVersion, nextVersion } = onMutateResult;

        context.client.setQueryData(queryKey, (prev) => {
          const tierList = produce(prev?.tierList, (tierList) => {
            if (!tierList) return;

            tierList.items[id] = prevItem;
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
