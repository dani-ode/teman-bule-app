/**
 * LoadingStatus
 *
 * Menampilkan urutan status "seolah AI sedang berpikir" di dalam ruang chat.
 * Setiap langkah punya durasi acak dalam rentangnya; langkah terakhir
 * ("Processing ...") ditahan sampai parent mengangkat `done` (hasil request
 * benar-benar selesai) agar tidak membohongi user.
 */
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Text } from '@/ui/components/Text';
import { theme } from '@/ui/theme';

export interface LoadingStep {
  readonly label: string;
  /** Rentang durasi acak [minMs, maxMs] sebelum lanjut ke langkah berikut. */
  readonly minMs: number;
  readonly maxMs: number;
  /** Tahan langkah ini sampai `done` = true (untuk langkah final). */
  readonly holdUntilDone?: boolean;
}

export interface LoadingStatusProps {
  readonly steps: readonly LoadingStep[];
  /** Naik saat proses nyata selesai; melepaskan langkah hold terakhir. */
  readonly done: boolean;
  /** Dipanggil sekali saat seluruh urutan selesai. */
  readonly onFinished?: () => void;
  /**
   * Saat true, langkah terakhir yang holdUntilDone TETAP ditampilkan selama
   * proses nyata belum selesai (done=false), sehingga user tidak menatap
   * layar blank menunggu jawaban AI.
   */
  readonly holdVisible?: boolean;
}

const randomInRange = (min: number, max: number): number =>
  Math.round(min + Math.random() * Math.max(0, max - min));

export const LoadingStatus: React.FC<LoadingStatusProps> = ({
  steps,
  done,
  onFinished,
  holdVisible = false,
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  // Reset internal state saat daftar langkah berubah (turn baru).
  useEffect(() => {
    setStepIndex(0);
    setFinished(false);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [steps]);

  useEffect(() => {
    if (finished || steps.length === 0) return;
    const step = steps[Math.min(stepIndex, steps.length - 1)];

    const isLast = stepIndex >= steps.length - 1;
    if (isLast) {
      // Langkah terakhir: tunggu `done` bila ditandai hold.
      if (step.holdUntilDone && !done) return;
      setFinished(true);
      onFinishedRef.current?.();
      return;
    }

    timerRef.current = setTimeout(
      () => setStepIndex((i) => i + 1),
      randomInRange(step.minMs, step.maxMs),
    );
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [stepIndex, steps, done, finished]);

  // Lepaskan penahanan saat `done` tiba di langkah terakhir.
  useEffect(() => {
    if (finished || steps.length === 0) return;
    if (stepIndex >= steps.length - 1 && done) {
      setFinished(true);
      onFinishedRef.current?.();
    }
  }, [done, finished, stepIndex, steps]);

  if (finished || steps.length === 0) return null;

  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const isLastStep = stepIndex >= steps.length - 1;
  // Pada langkah hold terakhir: sembunyikan saat proses selesai (default),
  // atau tetap tampil menunggu hasil nyata bila holdVisible aktif.
  if (isLastStep && step.holdUntilDone && (holdVisible ? done : !done)) return null;

  return (
    <View
      className="flex-row items-center gap-2 px-4 py-2"
      accessibilityLiveRegion="polite"
      accessibilityLabel={step.label}
    >
      <ActivityIndicator size="small" color={theme.colors.primary[600]} />
      <Text variant="caption" color="muted" className="italic">
        {step.label}
      </Text>
    </View>
  );
};
