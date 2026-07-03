import globals from 'globals';
import js from '@eslint/js';
import nodePlugin from 'eslint-plugin-n';

const TEST_MAX_STATEMENTS = 20;

export default [
  js.configs.all,
  nodePlugin.configs['flat/recommended-module'],
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'no-console': ['error', { allow: ['log', 'error'] }],
      'no-magic-numbers': ['error', { ignore: [-1, 0, 1, 2] }],
      'no-ternary': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'one-var': ['error', 'never'],
    },
  },
  {
    files: ['test/*.test.js'],
    rules: {
      'max-statements': ['error', TEST_MAX_STATEMENTS],
    },
  },
  {
    files: ['example/cli.js', 'test/fixtures/app/cli.js', 'test/fixtures/bad-dir-cli.js'],
    rules: {
      'n/hashbang': 'off',
    },
  },
];
