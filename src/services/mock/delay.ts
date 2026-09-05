import { envConfig } from '@/config/env.config';

/**
 * Utility to simulate asynchronous network latency for mock services.
 */
export const simulateNetworkDelay = (customMs?: number): Promise<void> => {
  const ms = customMs ?? envConfig.mockLatencyMs;
  return new Promise((resolve) => setTimeout(resolve, ms));
};
