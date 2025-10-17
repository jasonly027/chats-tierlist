import { defineConfig } from 'orval';

export default defineConfig({
  chatsTierList: {
    input: '../backend/docs/openapi.yaml',
    output: {
      mode: 'tags-split',
      target: 'src/lib/gen/endpoints',
      schemas: 'src/lib/gen/models',
      client: 'react-query',
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write',
    },
  },
  chatsTierListZod: {
    input: '../backend/docs/openapi.yaml',
    output: {
      mode: 'tags-split',
      client: 'zod',
      target: 'src/lib/gen/endpoints',
      fileExtension: '.zod.ts',
    },
  },
});
