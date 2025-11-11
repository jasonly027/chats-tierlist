import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, type ReactNode } from 'react';
import toast from 'react-hot-toast';

import { env } from '@/config/env';
import { UserContext } from '@/hooks/use-user';
import {
  getGetUserProfileQueryKey,
  useGetUserProfile,
  useLogOutUser,
} from '@/lib/gen/endpoints/auth/auth';
import type { GetUserProfile200Data } from '@/lib/gen/models';
import { type User } from '@/types/api';

export interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const { user, isLoading } = useUserInternal();
  const logOutMutation = useLogOutMutation();

  const context: UserContext = useMemo(
    () => ({
      user: user ? dtoToUser(user) : null,

      isLoading,

      logIn() {
        window.location.href = `${env.BACKEND_URL}/login`;
      },

      logOut() {
        logOutMutation.mutate(undefined, {
          onSuccess() {
            window.location.href = '/';
          },
        });
      },
    }),
    [user, isLoading, logOutMutation]
  );

  return <UserContext value={context}>{children}</UserContext>;
}

function useUserInternal() {
  const MAX_RETRY = 2;
  const { data, isLoading, error } = useGetUserProfile({
    query: {
      staleTime: Infinity,

      retry(failureCount, error) {
        if (error.status === 401) {
          return false;
        }
        return failureCount < MAX_RETRY;
      },

      meta: {
        preventDefaultErrorHandler: true,
      },
    },
  });

  useEffect(
    function handleError() {
      if (!error) return;
      // User not logged in
      if (error.status === 401) {
        return;
      }

      toast.error('Failed to get login info');
    },
    [error]
  );

  return { user: data?.data, isLoading };
}

function useLogOutMutation() {
  const queryClient = useQueryClient();

  return useLogOutUser({
    mutation: {
      onSuccess() {
        return queryClient.removeQueries({
          queryKey: getGetUserProfileQueryKey(),
        });
      },
    },
  });
}

function dtoToUser(user: GetUserProfile200Data): User {
  return {
    twitchId: user.twitch_id,
    name: user.name,
    displayName: user.display_name,
    imageUrl: user.profile_image_url,
  };
}
