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
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            backgroundColor: 'var(--color-gray-800)',
            borderRadius: 'var(--radius-xs)',
            color: 'currentColor',
            border: '1px solid var(--color-gray-900)',
          },
        }}
      />
      <QueryProvider>
        <UserProvider>{children}</UserProvider>
      </QueryProvider>
    </>
  );
}
