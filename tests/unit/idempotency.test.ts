import { describe, it, expect } from 'vitest';
import { newIdempotencyKey, IdempotencyKeyScope } from '@/core/network/idempotency';

describe('idempotency', () => {
  it('generates unique keys', () => {
    const a = newIdempotencyKey();
    const b = newIdempotencyKey();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(8);
  });

  it('scope returns a stable key across reads (retry preserves identity)', () => {
    const scope = new IdempotencyKeyScope();
    const first = scope.getOrCreate();
    expect(scope.getOrCreate()).toBe(first);
  });

  it('scope reset produces a new key for a new logical action', () => {
    const scope = new IdempotencyKeyScope();
    const first = scope.getOrCreate();
    scope.reset();
    expect(scope.getOrCreate()).not.toBe(first);
  });
});
