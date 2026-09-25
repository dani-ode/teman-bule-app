/**
 * Account domain: profile, plan, wallet, BYOK credentials.
 * Mirrors backend DTOs; UI keeps its own view models separate.
 */

export type PlanCode = 'vip' | 'advance';

export interface AccountProfile {
  readonly userId: string;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly displayName: string | null;
  readonly status: string;
}

export interface PlanSelection {
  readonly planCode: string;
  readonly revision: number;
  readonly selectedAt: string;
}

export interface Wallet {
  readonly asset: string;
  readonly availableUnits: number;
  readonly heldUnits: number;
  readonly version: number;
}

export interface AiCredential {
  readonly credentialId: string;
  readonly providerId: string;
  readonly status: string;
  readonly fingerprint: string;
  readonly verifiedAt: string | null;
}

export type AiCapability = 'llm' | 'stt';
