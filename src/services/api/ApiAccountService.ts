import { IAccountService } from '@/domain/account/IAccountService';
import {
  AccountProfile,
  AiCapability,
  AiCredential,
  PlanCode,
  PlanSelection,
  Wallet,
} from '@/domain/account/account.types';
import { HttpTransport, decode } from '@/core/network/HttpTransport';
import { IdempotencyKeyScope } from '@/core/network/idempotency';
import {
  credentialResponseSchema,
  planSelectionResponseSchema,
  profileResponseSchema,
  selectModelResponseSchema,
  walletResponseSchema,
} from './dto/account.dto';
import { deletionResponseSchema } from './dto/domain.dto';

export class ApiAccountService implements IAccountService {
  private readonly deletionKeyScope = new IdempotencyKeyScope();

  constructor(private readonly http: HttpTransport) {}

  public async getProfile(): Promise<AccountProfile> {
    const data = decode(
      profileResponseSchema,
      await this.http.request({ method: 'GET', path: '/me/profile' }),
    );
    return {
      userId: data.user_id,
      email: data.email,
      emailVerified: data.email_verified,
      displayName: data.display_name,
      status: data.status,
    };
  }

  public async getPlan(): Promise<PlanSelection> {
    const data = decode(
      planSelectionResponseSchema,
      await this.http.request({ method: 'GET', path: '/me/plan' }),
    );
    return this.mapPlan(data);
  }

  public async selectPlan(planCode: PlanCode, expectedRevision?: number): Promise<PlanSelection> {
    const data = decode(
      planSelectionResponseSchema,
      await this.http.request({
        method: 'PUT',
        path: '/me/plan',
        body: { plan_code: planCode, expected_revision: expectedRevision ?? null },
      }),
    );
    return this.mapPlan(data);
  }

  private mapPlan(data: { plan_code: string; revision: number; selected_at: string }): PlanSelection {
    return { planCode: data.plan_code, revision: data.revision, selectedAt: data.selected_at };
  }

  public async getWallet(): Promise<Wallet> {
    const data = decode(
      walletResponseSchema,
      await this.http.request({ method: 'GET', path: '/billing/wallet' }),
    );
    return {
      asset: data.asset,
      availableUnits: data.available_units,
      heldUnits: data.held_units,
      version: data.version,
    };
  }

  public async registerCredential(input: {
    providerId: string;
    apiKey: string;
    baseUrl?: string;
  }): Promise<AiCredential> {
    const data = decode(
      credentialResponseSchema,
      await this.http.request({
        method: 'POST',
        path: '/me/ai-credentials',
        body: {
          provider_id: input.providerId,
          api_key: input.apiKey,
          base_url: input.baseUrl ?? null,
        },
      }),
    );
    return this.mapCredential(data);
  }

  private mapCredential(data: {
    credential_id: string;
    provider_id: string;
    status: string;
    fingerprint: string;
    verified_at: string | null;
  }): AiCredential {
    return {
      credentialId: data.credential_id,
      providerId: data.provider_id,
      status: data.status,
      fingerprint: data.fingerprint,
      verifiedAt: data.verified_at,
    };
  }

  public async selectModel(input: {
    capability: AiCapability;
    credentialId: string;
    modelId: string;
  }): Promise<void> {
    decode(
      selectModelResponseSchema,
      await this.http.request({
        method: 'PUT',
        path: '/me/ai-credentials/selections',
        body: {
          capability: input.capability,
          credential_id: input.credentialId,
          model_id: input.modelId,
        },
      }),
    );
  }

  public async revokeCredential(credentialId: string): Promise<void> {
    await this.http.request({
      method: 'DELETE',
      path: `/me/ai-credentials/${credentialId}`,
    });
  }

  public async requestAccountDeletion(): Promise<{ deletionRequestId: string; status: string }> {
    const data = decode(
      deletionResponseSchema,
      await this.http.request({
        method: 'DELETE',
        path: '/me',
        idempotencyKey: this.deletionKeyScope.getOrCreate(),
      }),
    );
    this.deletionKeyScope.reset();
    return { deletionRequestId: data.deletion_request_id, status: data.status };
  }
}
