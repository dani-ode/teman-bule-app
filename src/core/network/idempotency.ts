/**
 * Deterministic idempotency key generation per logical action.
 * Keys are stable for the lifetime of the action; retry preserves the key.
 */
export const newIdempotencyKey = (): string => {
  // ULID-like: timestamp + randomness; uniqueness is what matters, not format.
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 12);
  const random2 = Math.random().toString(36).slice(2, 12);
  return `idem_${timestamp}${random}${random2}`;
};

/**
 * Holds one in-flight logical action's key so retries reuse the same key.
 */
export class IdempotencyKeyScope {
  private key: string | null = null;

  public getOrCreate(): string {
    if (this.key === null) {
      this.key = newIdempotencyKey();
    }
    return this.key;
  }

  public reset(): void {
    this.key = null;
  }
}
