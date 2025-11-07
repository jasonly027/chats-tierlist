import { useQueryClient } from '@tanstack/react-query';
import { produce } from 'immer';

import { useTierList } from '@/features/tierlist/hooks/use-tier-list';
import type { Item, TierList } from '@/features/tierlist/types/tier-list';
import { useAddItem as useAddItemApi } from '@/lib/gen/endpoints/tier-list/tier-list';

export function useAddItem() {
  const { queryKey } = useTierList();
  const client = useQueryClient();

  return useAddItemApi({
    mutation: {
      onMutate(_variables, { client }) {
        const list = client.getQueryData(queryKey);
        if (!list) return;
        const prevVersion = list.version;

        const nextVersion = Date.now();
        client.setQueryData(
          queryKey,
          produce((tierList: TierList | undefined) => {
            if (!tierList) return;

            tierList.version = nextVersion;

            return tierList;
          })
        );

        return { prevVersion, nextVersion };
      },

      onError(_error, _variables, onMutateResult, context) {
        if (!onMutateResult) return;
        const { prevVersion, nextVersion } = onMutateResult;

        context.client.setQueryData(
          queryKey,
          produce((tierList: TierList | undefined) => {
            if (!tierList) return;

            if (tierList.version === nextVersion) {
              tierList.version = prevVersion;
            }

            return tierList;
          })
        );
      },

      onSuccess({ id }, { data: { name, image_url } }) {
        const list = client.getQueryData(queryKey);
        if (!list) return;

        list.items[id] = {
          id,
          name,
          imageUrl: image_url ?? null,
        } satisfies Item;
      },
    },
  });
}
