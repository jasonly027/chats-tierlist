import { produce } from 'immer';

import { useTierList } from '@/features/tierlist/hooks/use-tier-list';
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
        client.setQueryData(queryKey, (prev) => {
          if (!prev) return;

          return produce(prev, (draft) => {
            const tier = draft.tiers.find((t) => t.id === id);
            if (!tier) return;
            tier.name = data.name ?? tier.name;
            draft.version = nextVersion;
          });
        });

        return { prevTier: prevTier, prevVersion, nextVersion };
      },

      onError(_error, { data }, onMutateResult, context) {
        context.client.setQueryData(queryKey, (prev) => {
          if (!prev || !onMutateResult) return;
          const { prevTier, prevVersion, nextVersion } = onMutateResult;

          return produce(prev, (draft) => {
            const tier = draft.tiers.find((t) => t.id === prevTier.id);
            if (!tier) return;

            if (data.name !== undefined) {
              tier.name = prevTier.name;
            }
            if (draft.version === nextVersion) {
              draft.version = prevVersion;
            }
          });
        });
      },
    },
  });
}
