import { defineConfig } from 'vitest/config';
import path from 'node:path';

/**
 * Unit tests for pure frontend-owned logic (error mapping, idempotency,
 * wire DTO decoding, message reducer). No vendor/native modules; these do
 * not certify backend/vendor compatibility (testing-acceptance.md).
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
  },
});
