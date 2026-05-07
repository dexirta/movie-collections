import eslint from '@eslint/js';
import { configs as angularConfigs, processInlineTemplates } from 'angular-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores([
    'dist/**',
    'node_modules/**',
    'coverage/**',
    '.angular/**',
    'eslint.config.mjs',
    '**/*.js',
  ]),
  {
    files: ['src/**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angularConfigs.tsRecommended,
    ],
    processor: processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
    },
  },
  {
    files: ['src/**/*.html'],
    extends: [...angularConfigs.templateRecommended, ...angularConfigs.templateAccessibility],
    rules: {},
  },
  eslintConfigPrettier,
);
