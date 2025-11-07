import { produce } from 'immer';

import { useTierList } from '@/features/tierlist/hooks/use-tier-list';
import type { TierList } from '@/features/tierlist/types/tier-list';
import { useUpdateTier as useUpdateTierApi } from '@/lib/gen/endpoints/tier-list/tier-list';

export function useUpdateTier() {
  const { queryKey } = useTierList();

  return useUpdateTierApi({
    mutation: {
      onMutate({ id, data }, { client }) {
        const list = client.getQueryData(queryKey);
        const prevTier = list?.tiers.find((t) => t.id === id);
        if (!list || !prevTier) throw new ReferenceError('Tier not found');
        const prevVersion = list.version;

        const nextVersion = Date.now();
        client.setQueryData(
          queryKey,
          produce((tierList: TierList | undefined) => {
            if (!tierList) return;

            const tier = tierList.tiers.find((t) => t.id === id);
            if (!tier) return;

            if (data.name !== undefined) {
              tier.name = data.name;
            }
            tierList.version = nextVersion;

            return tierList;
          })
        );

        return { prevTier, prevVersion, nextVersion };
      },

      onError(_error, { data }, onMutateResult, context) {
        if (!onMutateResult) return;
        const { prevTier, prevVersion, nextVersion } = onMutateResult;

        context.client.setQueryData(
          queryKey,
          produce((tierList: TierList | undefined) => {
            if (!tierList) return;

            const tier = tierList.tiers.find((t) => t.id === prevTier.id);
            if (!tier) return;

            if (data.name !== undefined) {
              tier.name = prevTier.name;
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
