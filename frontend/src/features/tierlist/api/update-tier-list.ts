import { produce } from 'immer';

import { useTierList } from '@/features/tierlist/hooks/use-tier-list';
import { useUpdateTierList as useUpdateTierListApi } from '@/lib/gen/endpoints/tier-list/tier-list';

export function useUpdateTierList() {
  const { queryKey } = useTierList();

  return useUpdateTierListApi({
    mutation: {
      onMutate({ data }, { client }) {
        const { tierList } = client.getQueryData(queryKey) ?? {};
        if (!tierList) throw new Error('Missing Tier List');

        const prevSettings: typeof data = {};
        if (data.is_voting !== undefined) {
          prevSettings.is_voting = tierList.isVoting;
        }
        if (data.focus !== undefined) {
          prevSettings.focus = tierList.focus;
        }
        const prevVersion = tierList.version;

        const nextVersion = prevVersion + 1;
        client.setQueryData(queryKey, (prev) => {
          const tierList = produce(prev?.tierList, (tierList) => {
            if (!tierList) return;

            if (data.is_voting !== undefined) {
              tierList.isVoting = data.is_voting;
            }
            if (data.focus !== undefined) {
              tierList.focus = data.focus;
            }
            tierList.version = nextVersion;
          });

          return {
            ...prev,
            tierList,
          };
        });

        return { prevSettings, prevVersion, nextVersion };
      },

      onError(_error, _variables, onMutateResult, context) {
        if (!onMutateResult) return;
        const { prevSettings, prevVersion, nextVersion } = onMutateResult;

        context.client.setQueryData(queryKey, (prev) => {
          const tierList = produce(prev?.tierList, (tierList) => {
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
