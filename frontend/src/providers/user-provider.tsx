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
  const { user, isLoading } = useUserInternal();
  const logOutMutation = useLogOutMutation();

  const context: UserContext = useMemo(
    () => ({
      user,

      isLoading,

      logIn() {
        window.location.href = `${env.BACKEND_URL}/login`;
      },

      logOut() {
        logOutMutation.mutate();
      },
    }),
    [user, isLoading, logOutMutation]
  );

  return <UserContext value={context}>{children}</UserContext>;
}

function useUserInternal() {
  const { data, isLoading, error } = useQuery(getUserQueryOptions());

  const user = useMemo(() => {
    const dto = data?.data?.data;
    return dto ? dtoToUser(dto) : null;
  }, [data]);

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

  return { user, isLoading };
}

function getUserQueryOptions() {
  const MAX_RETRY = 2;

  return queryOptions({
    queryKey: ['auth', 'me'],
    queryFn: () => api.GET('/auth/me'),
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
    name: user.display_name,
    twitchId: user.twitch_id,
    imageUrl: user.profile_image_url,
  };
}
