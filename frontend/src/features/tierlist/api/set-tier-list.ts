import { useQueryClient } from '@tanstack/react-query';
import { produce } from 'immer';

import { dtoToTierList } from '@/features/tierlist/api/get-tier-list';
import { useTierList } from '@/features/tierlist/hooks/use-tier-list';
import type { TierList } from '@/features/tierlist/types/tier-list';
import { useSetTierList as useSetTierListApi } from '@/lib/gen/endpoints/tier-list/tier-list';

export function useSetTierList() {
  const { queryKey } = useTierList();
  const client = useQueryClient();

  return useSetTierListApi({
    mutation: {
      onMutate(_variables, { client }) {
        const list = client.getQueryData(queryKey);
        if (!list) throw new ReferenceError('Missing Tier List');

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

      onSuccess({ tier_list }) {
        client.setQueryData(queryKey, dtoToTierList(tier_list));
      },
    },
  });
}
