import { LoadingStep } from '../components/LoadingStatus';

/**
 * Tahap progres satu turn AI (greeting / jawaban teks / jawaban voice).
 * Klien voice melalui fase upload + transcribe SEBELUM stream SSE dimulai,
 * jadi tahap itu digabung di sini agar user selalu melihat status, tidak
 * pernah menatap layar blank.
 */
export type AgentProgressStage =
  | 'idle'
  | 'uploading'
  | 'transcribing'
  | 'connecting'
  | 'generating'
  | 'processing';

/** Sumber tahap dari hook SSE ('generating'/'processing' dst) atau null. */
export type StreamStage = 'connecting' | 'transcribing' | 'generating' | 'processing' | null;

const rank: Record<AgentProgressStage, number> = {
  idle: 0,
  connecting: 1,
  uploading: 1,
  transcribing: 2,
  generating: 3,
  processing: 4,
};

/** Berarti proses masih berjalan (boleh menampilkan indikator). */
export const isAgentProgressActive = (stage: AgentProgressStage): boolean => stage !== 'idle';

/**
 * Gabungkan tahap baru ke tahap saat ini. Progres tidak pernah mundur
 * (mis. event 'generating' tidak menimpa 'processing') agar label status
 * stabil; hanya tahap 'idle' yang selalu menang (reset / selesai / gagal).
 */
export const reduceAgentProgress = (
  current: AgentProgressStage,
  next: AgentProgressStage,
): AgentProgressStage => {
  if (next === 'idle') return 'idle';
  if (current === 'idle') return next;
  return rank[next] > rank[current] ? next : current;
};

export interface AgentProgressStepsInput {
  readonly stage: AgentProgressStage;
  readonly agentName: string;
  /** Pesan voice user: tambahkan fase upload/transcribe sebelum AI menjawab. */
  readonly isVoice: boolean;
}

/**
 * Bangun urutan langkah status untuk LoadingStatus. Label yang sudah dilewati
 * tidak ditampilkan lagi; langkah terakhir ditahan sampai proses nyata selesai.
 */
export const agentProgressSteps = (input: AgentProgressStepsInput): readonly LoadingStep[] => {
  const { stage, agentName, isVoice } = input;
  const steps: LoadingStep[] = [];
  if (isVoice) {
    if (rank[stage] <= rank.uploading) steps.push({ label: 'Uploading your voice message…', minMs: 400, maxMs: 900 });
    if (rank[stage] <= rank.transcribing) steps.push({ label: 'Transcribing your voice…', minMs: 400, maxMs: 900 });
  }
  if (rank[stage] <= rank.connecting) steps.push({ label: `Connecting to ${agentName}…`, minMs: 300, maxMs: 700 });
  if (rank[stage] <= rank.generating) steps.push({ label: `${agentName} is thinking…`, minMs: 500, maxMs: 1000 });
  steps.push({ label: `${agentName} is preparing a reply…`, minMs: 0, maxMs: 0, holdUntilDone: true });
  return steps;
};
