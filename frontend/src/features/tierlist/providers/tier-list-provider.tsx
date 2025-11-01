import { useMemo, type ReactNode } from 'react';

import {
  getTierListOptions,
  useGetTierList,
} from '@/features/tierlist/api/get-tier-list';
import { TierListContext } from '@/features/tierlist/hooks/use-tier-list';
import type { TierList } from '@/features/tierlist/types/tier-list';

export interface TierListProviderProps {
  name: string;
  children: ReactNode;
}

export interface TierListContextValues {
  name: string;
  queryKey: ReturnType<typeof getTierListOptions>['queryKey'];
  tierList: TierList | undefined;
  isLoading: boolean;
}

export function TierListProvider({ name, children }: TierListProviderProps) {
  const { data, isLoading } = useGetTierList({ name });

  const context: TierListContextValues = useMemo(
    () => ({
      name,
      tierList: data,
      isLoading,
      queryKey: getTierListOptions(name).queryKey,
    }),
    [data, isLoading, name]
  );

  return <TierListContext value={context}>{children}</TierListContext>;
}
