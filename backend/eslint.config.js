// @ts-check

import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import json from '@eslint/json';
import imports from 'eslint-plugin-import';
import prettier from 'eslint-plugin-prettier/recommended';
import { defineConfig, globalIgnores } from 'eslint/config';
import pluginChaiFriendly from 'eslint-plugin-chai-friendly';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      imports.flatConfigs.recommended,
      imports.flatConfigs.typescript,
      // Must be last to override
      prettier,
    ],
    plugins: {
      // @ts-expect-error Plugin doesn't provide TS
      'chai-friendly': pluginChaiFriendly,
    },
    languageOptions: {
      globals: globals.node,
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
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],

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

      '@typescript-eslint/no-unused-expressions': 'off',
      'chai-friendly/no-unused-expressions': 'error',
    },
  },
  {
    files: ['migrations/**'],
    rules: {
      '@typescript-eslint/require-await': 'off',
    },
  },
  {
    files: ['**/*.json'],
    plugins: { json },
    language: 'json/json',
    extends: ['json/recommended'],
  },
  {
    files: ['**/*.jsonc'],
    plugins: { json },
    language: 'json/jsonc',
    extends: ['json/recommended'],
  },
  {
    files: ['package-lock.json'],
    rules: { 'json/no-empty-keys': 'off' },
  },
]);
