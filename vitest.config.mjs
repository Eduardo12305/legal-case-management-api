import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    fileParallelism: false,
    globals: true,
    setupFiles: ['./tests/setup/testEnv.js'],
    include: ['tests/**/*.test.js'],
    hookTimeout: 30000,
    testTimeout: 30000,
  },
});
