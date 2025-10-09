import { type ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';

import QueryProvider from '@/providers/query-provider';
import { UserProvider } from '@/providers/user-provider';

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <>
      <Toaster position="bottom-right" />
      <QueryProvider>
        <UserProvider>{children}</UserProvider>
      </QueryProvider>
    </>
  );
}
