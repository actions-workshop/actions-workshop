import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import primerReact from 'eslint-plugin-primer-react';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        React: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      prettier,
      'primer-react': primerReact,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      ...primerReact.configs.recommended.rules,
      'prettier/prettier': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-undef': 'off', // TypeScript handles this
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
];
