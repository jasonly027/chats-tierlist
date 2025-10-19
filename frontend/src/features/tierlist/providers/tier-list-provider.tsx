import { useQueryClient } from '@tanstack/react-query';
import { produce } from 'immer';
import { useCallback, useMemo, type ReactNode } from 'react';

import {
  getTierListOptions,
  useGetTierList,
} from '@/features/tierlist/api/get-tier-list';
import {
  TierListContext,
  type TierListSetAction,
} from '@/features/tierlist/hooks/use-tier-list';
import { useUpdateTier as useUpdateTierApi } from '@/lib/gen/endpoints/tier-list/tier-list';

export interface TierListProviderProps {
  name: string;
  children: ReactNode;
}

export function TierListProvider({ name, children }: TierListProviderProps) {
  const { data, isLoading } = useGetTierList({ name });
  const setTierList = useSetTierList(name);

  const context: TierListContext = useMemo(
    () => ({
      tierList: data,

      isLoading,

      getQueryKey: () => getTierListOptions(name).queryKey,

      setTierList,
    }),
    [data, isLoading, name, setTierList]
  );

  return <TierListContext value={context}>{children}</TierListContext>;
}

function useSetTierList(name: string): (data: TierListSetAction) => void {
  const { mutate: mutateUpdateTier } = useUpdateTier(name);

  const fn = useCallback(
    ({ action, payload }: TierListSetAction) => {
      if (action === 'updateTier') {
        mutateUpdateTier({ name: payload.tierName, data: payload.data });
      }
    },
    [mutateUpdateTier]
  );

  return fn;
}

function useUpdateTier(name: string) {
  const queryClient = useQueryClient();

  return useUpdateTierApi({
    mutation: {
      onMutate(variables) {
        queryClient.setQueryData(getTierListOptions(name).queryKey, (prev) => {
          if (!prev) return undefined;

          return produce(prev, (draft) => {
            const tier = draft.tiers.find(
              (tier) => tier.name === variables.name
            );
            if (!tier) return;

            tier.name = variables.data.name ?? tier.name;
            tier.color = variables.data.color ?? tier.color;
          });
        });
      },
    },
  });
}
