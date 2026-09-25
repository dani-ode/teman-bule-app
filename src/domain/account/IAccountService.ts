import {
  AccountProfile,
  AiCapability,
  AiCredential,
  PlanCode,
  PlanSelection,
  Wallet,
} from './account.types';

export interface IAccountService {
  getProfile(): Promise<AccountProfile>;
  getPlan(): Promise<PlanSelection>;
  /** expected_revision optimistic concurrency when provided. */
  selectPlan(planCode: PlanCode, expectedRevision?: number): Promise<PlanSelection>;
  getWallet(): Promise<Wallet>;
  registerCredential(input: {
    providerId: string;
    apiKey: string;
    baseUrl?: string;
  }): Promise<AiCredential>;
  selectModel(input: {
    capability: AiCapability;
    credentialId: string;
    modelId: string;
  }): Promise<void>;
  revokeCredential(credentialId: string): Promise<void>;
  /** Starts async deletion job; acceptance is not completion. */
  requestAccountDeletion(): Promise<{ deletionRequestId: string; status: string }>;
}
