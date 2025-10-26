import { useQueryClient } from '@tanstack/react-query';
import { produce } from 'immer';
import { useCallback, useMemo, type ReactNode } from 'react';

import {
  getTierListOptions,
  useGetTierList,
} from '@/features/tierlist/api/get-tier-list';
import {
  TierListContext,
  type TierListContextValues,
} from '@/features/tierlist/hooks/use-tier-list';
import {
  useUpdateTier as useUpdateTierApi,
  useUpdateItem as useUpdateItemApi,
} from '@/lib/gen/endpoints/tier-list/tier-list';

export interface TierListProviderProps {
  name: string;
  children: ReactNode;
}

export function TierListProvider({ name, children }: TierListProviderProps) {
  const { data, isLoading } = useGetTierList({ name });
  const updateTier = useUpdateTier(name);
  const updateItem = useUpdateItem(name);

  const context: TierListContextValues = useMemo(
    () => ({
      tierList: data,
      isLoading,
      getQueryKey: () => getTierListOptions(name).queryKey,
      updateTier,
      updateItem,
    }),
    [data, isLoading, name, updateTier, updateItem]
  );

  return <TierListContext value={context}>{children}</TierListContext>;
}

function useUpdateTier(name: string) {
  const { mutate } = useUpdateTierApi();
  const queryClient = useQueryClient();

  return useCallback(
    (tierName, data) => {
      const success = !!queryClient.setQueryData(
        getTierListOptions(name).queryKey,
        (prev) => {
          if (!prev || data.name === '') {
            return undefined;
          }
          // Prevent duplicate name
          if (
            data.name !== tierName &&
            prev.tiers.find((t) => t.name === data.name)
          ) {
            return undefined;
          }

          return produce(prev, (draft) => {
            const tier = draft.tiers.find((t) => t.name === tierName);
            if (!tier) return;
            tier.name = data.name ?? tier.name;
            tier.color = data.color ?? tier.color;
          });
        }
      );

      if (success) mutate({ name: tierName, data });

      return success;
    },
    [mutate, name, queryClient]
  ) satisfies TierListContextValues['updateTier'];
}

function useUpdateItem(name: string) {
  const { mutate } = useUpdateItemApi();
  const queryClient = useQueryClient();

  return useCallback(
    (itemName, data) => {
      const success = !!queryClient.setQueryData(
        getTierListOptions(name).queryKey,
        (prev) => {
          if (!prev || data.name === '') {
            return undefined;
          }
          // Prevent duplicate name
          if (
            data.name !== itemName &&
            prev._items.find((i) => i.name === data.name)
          ) {
            return undefined;
          }

          return produce(prev, (draft) => {
            const item = draft._items.find((i) => i.name === itemName);
            if (!item) return;

            item.name = data.name ?? item.name;
            item.imageUrl = data.image_url ?? item.imageUrl;
          });
        }
      );

      if (success) mutate({ name: itemName, data });

      return success;
    },
    [mutate, name, queryClient]
  ) satisfies TierListContextValues['updateItem'];
}
