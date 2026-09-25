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

export class EnvironmentConfigError extends Error {
  public readonly code = 'ERR_ENV_CONFIG';

  constructor(public readonly variable: string) {
    super(`Missing or invalid environment variable: ${variable}`);
    this.name = 'EnvironmentConfigError';
  }
}

const required = (name: string, value: string | undefined): string => {
  if (!value || value.trim() !== value) {
    throw new EnvironmentConfigError(name);
  }
  return value;
};

const integer = (name: string, value: string | undefined, allowZero: boolean): number => {
  const raw = required(name, value);
  const parsed = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(parsed) || (allowZero ? parsed < 0 : parsed <= 0)) {
    throw new EnvironmentConfigError(name);
  }
  return parsed;
};

const parseEnvironment = (value: string | undefined): AppEnvConfig['environment'] => {
  if (value !== 'development' && value !== 'staging' && value !== 'production') {
    throw new EnvironmentConfigError('EXPO_PUBLIC_APP_ENV');
  }
  return value;
};

const parseMockMode = (value: string | undefined, environment: AppEnvConfig['environment']): boolean => {
  if ((value !== 'true' && value !== 'false') || (value === 'true' && environment !== 'development')) {
    throw new EnvironmentConfigError('EXPO_PUBLIC_USE_MOCK_DATA');
  }
  return value === 'true';
};

const parseApiUrl = (value: string | undefined, environment: AppEnvConfig['environment']): string => {
  const name = 'EXPO_PUBLIC_API_BASE_URL';
  const raw = required(name, value);
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new EnvironmentConfigError(name);
  }
  if (
    !/^https?:\/\//.test(raw) || /[\s\\?#]/.test(raw) ||
    (url.protocol !== 'http:' && url.protocol !== 'https:') ||
    (environment !== 'development' && url.protocol !== 'https:') ||
    url.username || url.password || url.search || url.hash ||
    url.pathname !== '/v1' || !raw.endsWith('/v1')
  ) {
    throw new EnvironmentConfigError(name);
  }
  return raw;
};

// Expo CLI requires static dot notation to inline public environment values.
const environment = parseEnvironment(process.env.EXPO_PUBLIC_APP_ENV);

export const envConfig: AppEnvConfig = Object.freeze({
  environment,
  useMockData: parseMockMode(process.env.EXPO_PUBLIC_USE_MOCK_DATA, environment),
  mockLatencyMs: integer('EXPO_PUBLIC_MOCK_LATENCY_MS', process.env.EXPO_PUBLIC_MOCK_LATENCY_MS, true),
  apiBaseUrl: parseApiUrl(process.env.EXPO_PUBLIC_API_BASE_URL, environment),
  apiTimeoutMs: integer('EXPO_PUBLIC_API_TIMEOUT_MS', process.env.EXPO_PUBLIC_API_TIMEOUT_MS, false),
  appName: required('EXPO_PUBLIC_APP_NAME', process.env.EXPO_PUBLIC_APP_NAME),
  appVersion: required('EXPO_PUBLIC_APP_VERSION', process.env.EXPO_PUBLIC_APP_VERSION),
});
