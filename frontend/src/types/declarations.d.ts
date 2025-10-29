interface QueryMeta extends Record<string, unknown> {
  preventDefaultErrorHandler?: boolean;
}

interface MutationMeta extends Record<string, unknown> {
  preventDefaultErrorHandler?: boolean;
}

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: QueryMeta;
    mutationMeta: MutationMeta;
  }
}

export {};
