import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    fileParallelism: false, // to avoid rate limiting
    setupFiles: ['dotenv/config'],
    testTimeout: 10_000,
  },
});
