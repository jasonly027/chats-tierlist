import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, type ReactNode } from 'react';

import { env } from '@/config/env';
import { UserContext } from '@/hooks/use-user';
import { api } from '@/lib/api-client';
import type { User } from '@/types/api';
import type { paths } from '@/types/dto';

export interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const { isLoading, data: resp } = useUserQuery();
  const logOutMutation = useLogOutMutation();

  const context: UserContext = useMemo(
    () => ({
      user: resp?.data ? dtoToUser(resp.data.data) : null,

      isLoading,

      logIn() {
        window.location.href = `${env.BACKEND_URL}/login`;
      },

      logOut() {
        logOutMutation.mutate();
      },
    }),
    [resp?.data, isLoading, logOutMutation]
  );

  return <UserContext value={context}>{children}</UserContext>;
}

function getUserQueryKey() {
  return ['auth', 'me'];
}

function useUserQuery() {
  return useQuery({
    queryKey: getUserQueryKey(),
    queryFn: () => api.GET('/auth/me'),
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

function getLogOutQueryKey() {
  return ['logout'];
}

function useLogOutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: getLogOutQueryKey(),
    mutationFn: () => api.POST('/logout'),
    onSuccess(data) {
      if (!data.response.ok) return;

      return queryClient.cancelQueries({
        queryKey: getUserQueryKey(),
      });
    },
  });
}

type DtoUser =
  paths['/auth/me']['get']['responses'][200]['content']['application/json']['data'];

function dtoToUser(user: DtoUser): User {
  return {
    name: user.display_name,
    twitchId: user.twitch_id,
    imageUrl: user.twitch_id,
  };
}
