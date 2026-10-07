import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.ts'],
      globals: true,
      // Used with --coverage (CI). lcov paths are relative to the repo root for SonarCloud.
      coverage: {
        provider: 'v8',
        reporter: ['text-summary', ['lcov', { projectRoot: fileURLToPath(new URL('..', import.meta.url)) }]],
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.test.{ts,tsx}', 'src/setupTests.ts', 'src/main.tsx', 'src/**/*.d.ts', 'src/**/*.tsx', 'src/types/**', 'src/constants/**', 'src/theme/**'],
      },
    },
  })
);
