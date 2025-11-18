import { useMemo, type ReactNode } from 'react';

import {
  getTierListOptions,
  useGetTierList,
} from '@/features/tierlist/api/get-tier-list';
import { TierListContext } from '@/features/tierlist/hooks/use-tier-list';
import type { TierList } from '@/features/tierlist/types/tier-list';
import { useUser } from '@/hooks/use-user';
import type { User } from '@/types/api';

export interface TierListProviderProps {
  name: string;
  children: ReactNode;
}

export interface TierListContextValues {
  name: string;
  queryKey: ReturnType<typeof getTierListOptions>['queryKey'];
  channel: User | undefined;
  tierList: TierList | undefined;
  errorMessage: string | undefined;
  isLoading: boolean;
  isOwner: boolean;
}

export function TierListProvider({ name, children }: TierListProviderProps) {
  const { user } = useUser();

  const { data, isFetching: isLoading } = useGetTierList({ name });
  const channel = data?.channel;
  const tierList = data?.tierList;

  let errorMessage = undefined;
  if (data?.error === 'missingChannel') {
    errorMessage = `Channel "${name}" not found...`;
  } else if (data?.error === 'missingUser') {
    errorMessage = `${name} has not setup a tier list`;
  }

  const context: TierListContextValues = useMemo(
    () => ({
      name,
      channel,
      tierList,
      errorMessage,
      isLoading,
      queryKey: getTierListOptions(name).queryKey,
      isOwner: !!(user && channel && user.name === channel.name),
    }),
    [name, channel, tierList, errorMessage, isLoading, user]
  );

  return <TierListContext value={context}>{children}</TierListContext>;
}
