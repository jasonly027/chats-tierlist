import { produce } from 'immer';

import { useTierList } from '@/features/tierlist/hooks/use-tier-list';
import { useUpdateTier as useUpdateTierApi } from '@/lib/gen/endpoints/tier-list/tier-list';

export function useUpdateTier() {
  const { queryKey } = useTierList();

  return useUpdateTierApi({
    mutation: {
      onMutate({ id, data }, { client }) {
        const { tierList: list } = client.getQueryData(queryKey) ?? {};
        const prevTier = list?.tiers.find((t) => t.id === id);
        if (!list || !prevTier) throw new ReferenceError('Tier not found');
        const prevVersion = list.version;

        const nextVersion = prevVersion + 1;
        client.setQueryData(queryKey, (prev) => {
          const tierList = produce(prev?.tierList, (list) => {
            const tier = list?.tiers.find((t) => t.id === id);
            if (!list || !tier) return;

            if (data.name !== undefined) {
              tier.name = data.name;
            }
            list.version = nextVersion;
          });

          return {
            ...prev,
            tierList,
          };
        });

        return { prevTier, prevVersion, nextVersion };
      },

      onError(_error, { data }, onMutateResult, context) {
        if (!onMutateResult) return;
        const { prevTier, prevVersion, nextVersion } = onMutateResult;

        context.client.setQueryData(queryKey, (prev) => {
          const tierList = produce(prev?.tierList, (tierList) => {
            const tier = tierList?.tiers.find((t) => t.id === prevTier.id);
            if (!tierList || !tier) return;

            if (data.name !== undefined) {
              tier.name = prevTier.name;
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
