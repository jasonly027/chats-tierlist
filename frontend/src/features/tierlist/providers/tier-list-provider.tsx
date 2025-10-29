import { produce } from 'immer';
import { useMemo, type ReactNode } from 'react';

import {
  getTierListOptions,
  useGetTierList,
} from '@/features/tierlist/api/get-tier-list';
import { TierListContext } from '@/features/tierlist/hooks/use-tier-list';
import type { TierList } from '@/features/tierlist/types/tier-list';
import {
  useUpdateTier as useUpdateTierApi,
  useUpdateItem as useUpdateItemApi,
} from '@/lib/gen/endpoints/tier-list/tier-list';

export interface TierListProviderProps {
  name: string;
  children: ReactNode;
}

export interface TierListContextValues {
  getQueryKey: () => string[];
  tierList: TierList | undefined;
  isLoading: boolean;
  updateTier: ReturnType<typeof useUpdateTier>;
  updateItem: ReturnType<typeof useUpdateItem>;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, isLoading, name]
  );

  return <TierListContext value={context}>{children}</TierListContext>;
}

function useUpdateTier(name: string) {
  const hook = useUpdateTierApi({
    mutation: {
      onMutate({ id, data }, { client }) {
        const list = client.getQueryData(getTierListOptions(name).queryKey);
        const prevTier = list?.tiers.find((t) => t.id === id);
        const prevVersion = list?.version;
        if (!prevTier || !prevVersion) return;

        const nextVersion = Date.now();
        client.setQueryData(getTierListOptions(name).queryKey, (prev) => {
          if (!prev) return;

          return produce(prev, (draft) => {
            const tier = draft.tiers.find((t) => t.id === id);
            if (!tier) return;
            tier.name = data.name ?? tier.name;
            tier.color = data.color ?? tier.color;
            draft.version = nextVersion;
          });
        });

        return { prevTier: prevTier, prevVersion, nextVersion };
      },

      onError(_error, { data }, onMutateResult, context) {
        context.client.setQueryData(
          getTierListOptions(name).queryKey,
          (prev) => {
            if (!prev || !onMutateResult) return;
            const { prevTier, prevVersion, nextVersion } = onMutateResult;

            return produce(prev, (draft) => {
              const tier = draft.tiers.find((t) => t.id === prevTier.id);
              if (!tier) return;

              if (data.name !== undefined) {
                tier.name = prevTier.name;
              }
              if (data.color !== undefined) {
                tier.color = prevTier.color;
              }
              if (draft.version === nextVersion) {
                draft.version = prevVersion;
              }
            });
          }
        );
      },
    },
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => hook, [name]);
}

function useUpdateItem(name: string) {
  const hook = useUpdateItemApi({
    mutation: {
      onMutate({ id, data }, { client }) {
        const list = client.getQueryData(getTierListOptions(name).queryKey);
        const prevItem = list?._items.find((i) => i.id === id);
        const prevVersion = list?.version;
        if (!prevItem || !prevVersion) return;

        const nextVersion = Date.now();
        client.setQueryData(getTierListOptions(name).queryKey, (prev) => {
          if (!prev) return;

          return produce(prev, (draft) => {
            const item = draft._items.find((i) => i.id === id);
            if (!item) return;
            item.name = data.name ?? item.name;
            item.imageUrl = data.image_url ?? item.imageUrl;
            draft.version = nextVersion;
          });
        });

        return { prevItem, prevVersion, nextVersion };
      },

      onError(_error, { data }, onMutateResult, context) {
        context.client.setQueryData(
          getTierListOptions(name).queryKey,
          (prev) => {
            if (!prev || !onMutateResult) return;
            const { prevItem, prevVersion, nextVersion } = onMutateResult;

            return produce(prev, (draft) => {
              const item = draft._items.find((i) => i.id === prevItem.id);
              if (!item) return;

              if (data.name !== undefined) {
                item.name = prevItem.name;
              }
              if (data.image_url !== undefined) {
                item.imageUrl = prevItem.imageUrl;
              }
              if (draft.version === nextVersion) {
                draft.version = prevVersion;
              }
            });
          }
        );
      },
    },
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => hook, [name]);
}
