import { describe, it, expect } from 'vitest';
import {
  agentProgressSteps,
  isAgentProgressActive,
  reduceAgentProgress,
} from '@/features/practice/hooks/agentProgressReducer';

describe('agentProgressReducer', () => {
  it('idle tidak dianggap aktif; tahap lain aktif', () => {
    expect(isAgentProgressActive('idle')).toBe(false);
    expect(isAgentProgressActive('connecting')).toBe(true);
    expect(isAgentProgressActive('uploading')).toBe(true);
    expect(isAgentProgressActive('transcribing')).toBe(true);
    expect(isAgentProgressActive('generating')).toBe(true);
    expect(isAgentProgressActive('processing')).toBe(true);
  });

  it('progres tidak pernah mundur (event generating tidak menimpa processing)', () => {
    expect(reduceAgentProgress('processing', 'generating')).toBe('processing');
    expect(reduceAgentProgress('transcribing', 'connecting')).toBe('transcribing');
    expect(reduceAgentProgress('generating', 'processing')).toBe('processing');
  });

  it('dari idle bisa naik ke tahap mana pun; idle selalu mereset', () => {
    expect(reduceAgentProgress('idle', 'generating')).toBe('generating');
    expect(reduceAgentProgress('processing', 'idle')).toBe('idle');
    expect(reduceAgentProgress('uploading', 'idle')).toBe('idle');
  });

  it('turn teks: tanpa fase upload/transcribe, langkah terakhir ditahan', () => {
    const steps = agentProgressSteps({ stage: 'generating', agentName: 'Elean', isVoice: false });
    const labels = steps.map((s) => s.label);
    expect(labels.some((l) => l.includes('Uploading'))).toBe(false);
    expect(labels.some((l) => l.includes('Transcribing'))).toBe(false);
    expect(labels).toContain('Elean is thinking…');
    expect(labels[labels.length - 1]).toContain('preparing a reply');
    expect(steps[steps.length - 1].holdUntilDone).toBe(true);
  });

  it('turn voice: fase upload/transcribe muncul saat tahap masih awal', () => {
    const early = agentProgressSteps({ stage: 'uploading', agentName: 'Willy', isVoice: true });
    const earlyLabels = early.map((s) => s.label);
    expect(earlyLabels).toContain('Uploading your voice message…');
    expect(earlyLabels).toContain('Transcribing your voice…');

    // Setelah SSE berjalan, label yang sudah lewat tidak ditampilkan lagi.
    const late = agentProgressSteps({ stage: 'processing', agentName: 'Willy', isVoice: true });
    const lateLabels = late.map((s) => s.label);
    expect(lateLabels.some((l) => l.includes('Uploading'))).toBe(false);
    expect(lateLabels.some((l) => l.includes('thinking'))).toBe(false);
    expect(lateLabels[lateLabels.length - 1]).toContain('preparing a reply');
  });
});
