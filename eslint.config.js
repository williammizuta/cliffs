import js from '@eslint/js';

export default [
  js.configs.all,
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: {
        URL: 'readonly',
        console: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      'consistent-return': 'off',
      'func-names': 'off',
      'func-style': 'off',
      'max-lines-per-function': 'off',
      'max-statements': 'off',
      'no-console': 'off',
      'no-magic-numbers': 'off',
      'no-ternary': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'one-var': 'off',
      'prefer-arrow-callback': 'off',
      'prefer-destructuring': 'off',
      'require-await': 'off',
      'sort-imports': 'off',
    },
  },
];
