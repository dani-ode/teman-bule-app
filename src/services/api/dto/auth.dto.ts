/**
 * Wire DTO schemas for the auth endpoints.
 * Source of truth: backend src/temanbule/api/routers/auth.py + schemas/auth.py.
 */
import { z } from 'zod';

export const tokenPairResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string(),
  expires_in: z.number().int(),
});
export type TokenPairResponse = z.infer<typeof tokenPairResponseSchema>;

export const genericAcceptedResponseSchema = z.object({
  status: z.string(),
});
export type GenericAcceptedResponse = z.infer<typeof genericAcceptedResponseSchema>;

export const googleStartResponseSchema = z.object({
  authorization_url: z.string(),
});
export type GoogleStartResponse = z.infer<typeof googleStartResponseSchema>;
