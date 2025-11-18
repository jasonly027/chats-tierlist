import { useQueryClient } from '@tanstack/react-query';
import { produce } from 'immer';

import { useTierList } from '@/features/tierlist/hooks/use-tier-list';
import { useAddTier as useAddTierApi } from '@/lib/gen/endpoints/tier-list/tier-list';

export function useAddTier() {
  const { queryKey } = useTierList();
  const client = useQueryClient();

  return useAddTierApi({
    mutation: {
      onMutate() {
        const { tierList } = client.getQueryData(queryKey) ?? {};
        if (!tierList) return;
        const prevVersion = tierList.version;

        const nextVersion = prevVersion + 1;
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

      onSuccess({ id }, { data: { name } }) {
        client.setQueryData(queryKey, (prev) => {
          const tierList = produce(prev?.tierList, (tierList) => {
            if (!tierList) return;

            tierList.tiers.push({
              id,
              name,
              idx: tierList.tiers.length,
            });
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
