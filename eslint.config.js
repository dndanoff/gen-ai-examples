import eslint from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import jest from 'eslint-plugin-jest';
import globals from 'globals';

export default [
  // Base configuration for all files
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: typescriptParser,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },

    plugins: {
      '@typescript-eslint': typescript,
      import: importPlugin,
      prettier: prettier,
    },
    rules: {
      ...eslint.configs.recommended.rules,
      ...typescript.configs.recommended.rules,
      ...prettierConfig.rules,
      ...prettier.configs.recommended.rules,

      // Import rules
      'import/no-cycle': 'error',
      'import/prefer-default-export': 'off',

      // Custom rules
      'id-match': ['error', '^[_a-zA-Z0-9]+$'],
      'class-methods-use-this': 'error',
      'no-negated-condition': 'error',
      'no-console': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
    },
    settings: {
      'import/resolver': {
        typescript: {},
      },
    },
  },

  // Configuration for test files
  {
    files: ['**/*.spec.ts'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    plugins: {
      jest: jest,
    },
    rules: {
      ...jest.configs.recommended.rules,
      'jest/no-alias-methods': 'error',
      'jest/expect-expect': 'error',
    },
  },

  // Ignore patterns
  {
    ignores: ['dist/**', 'build/**'],
  },
];
