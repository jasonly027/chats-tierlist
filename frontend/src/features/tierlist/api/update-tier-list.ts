import { produce } from 'immer';

import { useTierList } from '@/features/tierlist/hooks/use-tier-list';
import type { TierList } from '@/features/tierlist/types/tier-list';
import { useUpdateTierList as useUpdateTierListApi } from '@/lib/gen/endpoints/tier-list/tier-list';

export function useUpdateTierList() {
  const { queryKey } = useTierList();

  return useUpdateTierListApi({
    mutation: {
      onMutate({ data }, { client }) {
        const list = client.getQueryData(queryKey);
        if (!list) throw new Error('Missing Tier List');

        const prevSettings: typeof data = {};
        if (data.is_voting !== undefined) {
          prevSettings.is_voting = list.isVoting;
        }
        if (data.focus !== undefined) {
          prevSettings.focus = list.focus;
        }
        const prevVersion = list.version;

        const nextVersion = Date.now();
        client.setQueryData(
          queryKey,
          produce((tierList: TierList | undefined) => {
            if (!tierList) return;

            if (data.is_voting !== undefined) {
              tierList.isVoting = data.is_voting;
            }
            if (data.focus !== undefined) {
              tierList.focus = data.focus;
            }
            tierList.version = nextVersion;

            return tierList;
          })
        );

        return { prevSettings, prevVersion, nextVersion };
      },

      onError(_error, _variables, onMutateResult, context) {
        if (!onMutateResult) return;
        const { prevSettings, prevVersion, nextVersion } = onMutateResult;

        context.client.setQueryData(
          queryKey,
          produce((tierList: TierList | undefined) => {
            if (!tierList) return;

            if (prevSettings.is_voting !== undefined) {
              tierList.isVoting = prevSettings.is_voting;
            }
            if (prevSettings.focus !== undefined) {
              tierList.focus = prevSettings.focus;
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
