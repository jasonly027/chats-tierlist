interface QueryMeta extends Record<string, unknown> {
  preventDefaultErrorHandler?: boolean;
}

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: QueryMeta;
  }
}

export {};
