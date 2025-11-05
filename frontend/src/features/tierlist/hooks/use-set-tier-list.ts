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
        const list = client.getQueryData(queryKey);
        if (!list) return;

        const prevVersion = list.version;
        const nextVersion = Date.now();

        client.setQueryData(queryKey, (prev) => {
          return produce(prev, (draft) => {
            if (!draft) return;

            draft.version = nextVersion;
          });
        });

        return { prevVersion, nextVersion };
      },

      onError(_error, _variables, onMutateResult, context) {
        if (!onMutateResult) return;
        const { prevVersion, nextVersion } = onMutateResult;

        context.client.setQueryData(queryKey, (prev) => {
          if (!prev) return;

          return produce(prev, (draft) => {
            if (draft.version === nextVersion) {
              draft.version = prevVersion;
            }
          });
        });
      },

      onSuccess({ tier_list }) {
        client.setQueryData(queryKey, dtoToTierList(tier_list));
      },
    },
  });
}
