import { produce } from 'immer';

import { useTierList } from '@/features/tierlist/hooks/use-tier-list';
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
        client.setQueryData(queryKey, (prev) => {
          return produce(prev, (draft) => {
            if (!draft) return;
            delete draft.items[id];
            draft.version = nextVersion;
          });
        });

        return { prevItem, prevVersion, nextVersion };
      },

      onError(_error, { id }, onMutateResult, context) {
        if (!onMutateResult) return;
        const { prevItem, prevVersion, nextVersion } = onMutateResult;

        context.client.setQueryData(queryKey, (prev) => {
          if (!prev) return;

          return produce(prev, (draft) => {
            draft.items[id] = prevItem;

            if (draft.version === nextVersion) {
              draft.version = prevVersion;
            }
          });
        });
      },
    },
  });
}
