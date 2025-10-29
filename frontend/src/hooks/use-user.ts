import { createContext, use } from 'react';

import type { User } from '@/types/api';

export interface UserContext {
  user: User | null;
  isLoading: boolean;
  logIn: () => void;
  logOut: () => void;
}

export const UserContext = createContext<UserContext | undefined>(undefined);

export function useUser(): UserContext {
  const context = use(UserContext);

  if (context === undefined) {
    throw new Error('useUser hook called outside of provider');
  }

  return context;
}
