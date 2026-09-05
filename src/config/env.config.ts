/**
 * Central Environment & Application Configuration
 * Strictly enforces externalized configuration parameters.
 */

export interface AppEnvConfig {
  readonly environment: 'development' | 'staging' | 'production';
  readonly useMockData: boolean;
  readonly mockLatencyMs: number;
  readonly apiBaseUrl: string;
  readonly apiTimeoutMs: number;
  readonly appName: string;
  readonly appVersion: string;
}

const getEnvVariable = (key: string, fallback: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  return fallback;
};

export const envConfig: AppEnvConfig = Object.freeze({
  environment: (getEnvVariable('EXPO_PUBLIC_APP_ENV', 'development') as AppEnvConfig['environment']),
  useMockData: getEnvVariable('EXPO_PUBLIC_USE_MOCK_DATA', 'true') === 'true',
  mockLatencyMs: parseInt(getEnvVariable('EXPO_PUBLIC_MOCK_LATENCY_MS', '750'), 10),
  apiBaseUrl: getEnvVariable('EXPO_PUBLIC_API_BASE_URL', 'https://api.temanbule.ai/v1'),
  apiTimeoutMs: parseInt(getEnvVariable('EXPO_PUBLIC_API_TIMEOUT_MS', '15000'), 10),
  appName: getEnvVariable('EXPO_PUBLIC_APP_NAME', 'TemanBule'),
  appVersion: getEnvVariable('EXPO_PUBLIC_APP_VERSION', '1.0.0'),
});
