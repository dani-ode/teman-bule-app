/**
 * Wire error envelope contract (backend api-events.md / api-design rule).
 * Server is authoritative for `request_id`; client never fabricates one
 * and masquerades it as server correlation.
 */

import { z } from 'zod';

export const wireErrorDetailSchema = z.object({
  field: z.string().optional(),
  message: z.string().optional(),
  code: z.string().optional(),
}).passthrough();

export const wireErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    request_id: z.string(),
    details: z.array(wireErrorDetailSchema).default([]),
  }),
});

export type WireErrorEnvelope = z.infer<typeof wireErrorEnvelopeSchema>;
export type WireErrorDetail = z.infer<typeof wireErrorDetailSchema>;
