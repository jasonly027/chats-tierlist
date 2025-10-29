import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode } from 'react';
import toast from 'react-hot-toast';

import { queryConfig } from '@/lib/react-query';

export interface QueryProviderProps {
  children: ReactNode;
}

export default function QueryProvider({ children }: QueryProviderProps) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: queryConfig,
        queryCache: new QueryCache({
          onError(error, query) {
            if (query.meta?.preventDefaultErrorHandler) return;
            toast.error(`Error: ${error.message}`);
          },
        }),
        mutationCache: new MutationCache({
          onError(error, _variables, _onMutateResult, _mutation, context) {
            if (context.meta?.preventDefaultErrorHandler) return;
            toast.error(`Error: ${error.message}`);
          },
        }),
      })
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
