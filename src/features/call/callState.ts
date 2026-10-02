/**
 * Pure call-session helpers (no React/native imports — unit-testable).
 *
 * Backend owns the call lifecycle; these helpers only mirror the documented
 * state semantics from livekit-realtime.md for UI decisions.
 */

/** Server call states after which the UI must never rejoin or revive media. */
export const TERMINAL_CALL_STATES: ReadonlySet<string> = new Set([
  'completed',
  'failed',
  'cancelled',
]);

export function isTerminalCallState(state: string): boolean {
  return TERMINAL_CALL_STATES.has(state);
}

/** mm:ss elapsed-time label for the in-call header. */
export function formatCallDuration(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) && totalSeconds > 0 ? Math.floor(totalSeconds) : 0;
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
