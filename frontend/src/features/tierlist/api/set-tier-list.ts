import { useQueryClient } from '@tanstack/react-query';
import { produce } from 'immer';

import { dtoToTierList } from '@/features/tierlist/api/get-tier-list';
import { useTierList } from '@/features/tierlist/hooks/use-tier-list';
import { useSetTierList as useSetTierListApi } from '@/lib/gen/endpoints/tier-list/tier-list';

export function useSetTierList() {
  const { queryKey } = useTierList();
  const client = useQueryClient();

  return useSetTierListApi({
    mutation: {
      onMutate(_variables, { client }) {
        const { tierList } = client.getQueryData(queryKey) ?? {};
        if (!tierList) throw new ReferenceError('Missing Tier List');

        const prevVersion = tierList.version;
        const nextVersion = Date.now();

        client.setQueryData(queryKey, (prev) => {
          const tierList = produce(prev?.tierList, (tierList) => {
            if (!tierList) return;
            tierList.version = nextVersion;
          });

          return {
            ...prev,
            tierList,
          };
        });

        return { prevVersion, nextVersion };
      },

      onError(_error, _variables, onMutateResult, context) {
        if (!onMutateResult) return;
        const { prevVersion, nextVersion } = onMutateResult;

        context.client.setQueryData(queryKey, (prev) => {
          const tierList = produce(prev?.tierList, (tierList) => {
            if (!tierList) return;
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

      onSuccess({ tier_list }) {
        client.setQueryData(queryKey, (prev) => ({
          ...prev,
          tierList: dtoToTierList(tier_list),
        }));
      },
    },
  });
}
