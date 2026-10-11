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
    // env.config divalidasi saat module import; sediakan nilai minimal
    // hermetic untuk unit test murni (bukan evidence backend/vendor).
    env: {
      EXPO_PUBLIC_APP_ENV: 'development',
      EXPO_PUBLIC_USE_MOCK_DATA: 'false',
      EXPO_PUBLIC_MOCK_LATENCY_MS: '0',
      EXPO_PUBLIC_API_BASE_URL: 'http://localhost:8010/v1',
      EXPO_PUBLIC_API_TIMEOUT_MS: '15000',
      EXPO_PUBLIC_LIVEKIT_URL: 'wss://localhost:7880',
      EXPO_PUBLIC_APP_NAME: 'TemanBule',
      EXPO_PUBLIC_APP_VERSION: '1.0.0',
    },
  },
});
