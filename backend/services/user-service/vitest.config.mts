import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Tests load @boutique/shared from its TypeScript source rather than the built
// dist/, so no build step is needed and vi.mock() applies to its imports too.
export default defineConfig({
  resolve: {
    alias: {
      '@boutique/shared': fileURLToPath(new URL('../../shared/src/index.ts', import.meta.url)),
    },
  },
  // Used with --coverage (CI). lcov paths are relative to the repo root, where
  // SonarCloud runs, so it can match them to source files.
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', ['lcov', { projectRoot: fileURLToPath(new URL('../../..', import.meta.url)) }], ['cobertura', { projectRoot: fileURLToPath(new URL('../../..', import.meta.url)) }]],
      include: ['**/src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/src/index.ts'],
      allowExternal: true,
    },
  },
});
