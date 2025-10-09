// @ts-check

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import imports from 'eslint-plugin-import';
import checkFile from 'eslint-plugin-check-file';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import eslintReact from '@eslint-react/eslint-plugin';
import tanstackRouter from '@tanstack/eslint-plugin-router';
import reactQuery from '@tanstack/eslint-plugin-query';
import prettier from 'eslint-plugin-prettier/recommended';
import { globalIgnores, defineConfig } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'check-file': checkFile,
    },
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      imports.flatConfigs.recommended,
      imports.flatConfigs.typescript,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
      eslintReact.configs['recommended-typescript'],
      tanstackRouter.configs['flat/recommended'],
      reactQuery.configs['flat/recommended'],
      // Must be last to override
      prettier,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      'import/resolver': {
        typescript: true,
      },
    },
    rules: {
      'import/no-cycle': 'error',
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/default': 'off',
      'import/no-named-as-default-member': 'off',
      'import/no-named-as-default': 'off',
      '@typescript-eslint/no-unused-vars': ['error'],
      'check-file/filename-naming-convention': [
        'error',
        {
          '**/*.{ts,tsx}': 'KEBAB_CASE',
        },
        {
          ignoreMiddleExtensions: true,
        },
      ],
    },
  },
  {
    files: ['src/app/routes/**'],
    rules: {
      'check-file/filename-naming-convention': 'off',
    },
  },
]);
