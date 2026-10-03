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
});
