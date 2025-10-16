import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useEffect, useMemo, type ReactNode } from 'react';
import toast from 'react-hot-toast';

import { env } from '@/config/env';
import { UserContext } from '@/hooks/use-user';
import { api, FetchError } from '@/lib/api-client';
import { type User } from '@/types/api';
import type { paths } from '@/types/dto';

export interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const { user: data, isLoading } = useUserInternal();
  const logOutMutation = useLogOutMutation();

  const context: UserContext = useMemo(
    () => ({
      user: data ?? null,

      isLoading,

      logIn() {
        window.location.href = `${env.BACKEND_URL}/login`;
      },

      logOut() {
        logOutMutation.mutate();
      },
    }),
    [data, isLoading, logOutMutation]
  );

  return <UserContext value={context}>{children}</UserContext>;
}

function useUserInternal() {
  const { data, isLoading, error } = useQuery(getUserQueryOptions());

  useEffect(
    function handleError() {
      if (!error) return;
      // User not logged in
      if (error instanceof FetchError && error.response.status === 401) {
        return;
      }

      toast.error('Failed to get login info');
    },
    [error]
  );

  return { user: data, isLoading };
}

function getUserQueryOptions() {
  const MAX_RETRY = 2;

  return queryOptions({
    queryKey: ['auth', 'me'],
    queryFn: getUser,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry(failureCount, error) {
      if (error instanceof FetchError && error.response.status === 401) {
        return false;
      }
      return failureCount < MAX_RETRY;
    },
    meta: {
      preventDefaultErrorHandler: true,
    },
  });
}

async function getUser() {
  return api.GET('/auth/me').then((res) => {
    const dto = res.data?.data;
    if (!dto) return null;
    return dtoToUser(dto);
  });
}

function useLogOutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['logout'],
    mutationFn: () => api.POST('/logout'),
    onSuccess() {
      return queryClient.removeQueries({
        queryKey: getUserQueryOptions().queryKey,
      });
    },
  });
}

type DtoUser =
  paths['/auth/me']['get']['responses'][200]['content']['application/json']['data'];

function dtoToUser(user: DtoUser): User {
  return {
    twitchId: user.twitch_id,
    name: user.name,
    displayName: user.display_name,
    imageUrl: user.profile_image_url,
  };
}
