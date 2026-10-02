import { describe, it, expect } from 'vitest';
import {
  TERMINAL_CALL_STATES,
  formatCallDuration,
  isTerminalCallState,
} from '@/features/call/callState';

describe('call state semantics (livekit-realtime.md)', () => {
  it('marks completed/failed/cancelled as terminal (never rejoined)', () => {
    for (const state of ['completed', 'failed', 'cancelled']) {
      expect(isTerminalCallState(state)).toBe(true);
      expect(TERMINAL_CALL_STATES.has(state)).toBe(true);
    }
  });

  it('treats nonterminal states as rejoinable candidates', () => {
    for (const state of ['created', 'connecting', 'active', 'ending']) {
      expect(isTerminalCallState(state)).toBe(false);
    }
  });
});

describe('formatCallDuration', () => {
  it('formats mm:ss with zero padding', () => {
    expect(formatCallDuration(0)).toBe('00:00');
    expect(formatCallDuration(7)).toBe('00:07');
    expect(formatCallDuration(65)).toBe('01:05');
    expect(formatCallDuration(600)).toBe('10:00');
  });

  it('clamps invalid input to 00:00 instead of producing NaN labels', () => {
    expect(formatCallDuration(-5)).toBe('00:00');
    expect(formatCallDuration(Number.NaN)).toBe('00:00');
  });

  it('floors fractional seconds', () => {
    expect(formatCallDuration(61.9)).toBe('01:01');
  });
});
