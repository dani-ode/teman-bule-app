/**
 * Wire DTO schemas for profile, plan, wallet, BYOK.
 * Source: backend routers profile.py, plans.py, billing.py, byok.py.
 */
import { z } from 'zod';

export const profileResponseSchema = z.object({
  user_id: z.string(),
  email: z.string(),
  email_verified: z.boolean(),
  display_name: z.string().nullable(),
  status: z.string(),
});
export type ProfileResponse = z.infer<typeof profileResponseSchema>;

export const planSelectionResponseSchema = z.object({
  plan_code: z.string(),
  revision: z.number().int(),
  selected_at: z.string(),
});
export type PlanSelectionResponse = z.infer<typeof planSelectionResponseSchema>;

export const walletResponseSchema = z.object({
  asset: z.string(),
  available_units: z.number().int(),
  held_units: z.number().int(),
  version: z.number().int(),
});
export type WalletResponse = z.infer<typeof walletResponseSchema>;

export const topupOrderResponseSchema = z.object({
  order_id: z.string(),
  merchant_reference: z.string(),
  state: z.string(),
  amount_minor: z.number().int(),
  currency: z.string(),
  token_units: z.number().int(),
  checkout_url: z.string().nullable(),
});
export type TopupOrderResponse = z.infer<typeof topupOrderResponseSchema>;

export const credentialResponseSchema = z.object({
  credential_id: z.string(),
  provider_id: z.string(),
  status: z.string(),
  fingerprint: z.string(),
  verified_at: z.string().nullable(),
});
export type CredentialResponse = z.infer<typeof credentialResponseSchema>;

export const selectModelResponseSchema = z.object({
  capability: z.string(),
  credential_id: z.string(),
  model_id: z.string(),
});
export type SelectModelResponse = z.infer<typeof selectModelResponseSchema>;
