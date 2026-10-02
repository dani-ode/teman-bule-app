/**
 * useHoldToTalk
 *
 * Hold-to-speak recorder built on expo-audio. Starts recording on press-in,
 * stops and returns the file on release; cancels on slide-away or when the
 * press is shorter than a minimum threshold (avoids accidental 0-byte notes).
 *
 * Recording permission is requested lazily. The hook owns the recorder
 * lifecycle; on unmount an in-flight recording is discarded.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  requestRecordingPermissionsAsync,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

export interface HoldToTalkResult {
  uri: string;
  durationMs: number;
}

export type HoldToTalkState =
  | 'idle'
  | 'requesting-permission'
  | 'recording'
  | 'cancelling';

export interface UseHoldToTalkOptions {
  /** Minimum ms of recording before a release is accepted. Default 600ms. */
  minDurationMs?: number;
  onFinish?: (result: HoldToTalkResult) => void;
  onCancel?: () => void;
  onPermissionDenied?: () => void;
}

export interface UseHoldToTalk {
  state: HoldToTalkState;
  /** Current elapsed recording ms (0 when idle). */
  elapsedMs: number;
  /** Call from Pressable onPressIn. */
  start: () => Promise<void>;
  /** Call from Pressable onPressOut. Pass `cancel=true` when finger slid away. */
  stop: (opts?: { cancel?: boolean }) => Promise<void>;
  /** Mark the next stop() as a cancel (e.g. finger slid off the button). */
  cancelOnSlide: () => void;
}

const DEFAULT_MIN_MS = 600;

export function useHoldToTalk(options: UseHoldToTalkOptions = {}): UseHoldToTalk {
  const { minDurationMs = DEFAULT_MIN_MS, onFinish, onCancel, onPermissionDenied } = options;

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 100);

  const [state, setState] = useState<HoldToTalkState>('idle');
  const startedAtRef = useRef<number>(0);
  const cancelledRef = useRef(false);

  // Discard in-flight recording on unmount.
  useEffect(() => {
    return () => {
      if (recorderState.isRecording) {
        try {
          recorder.stop();
        } catch {
          /* recorder already released */
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = useCallback(async () => {
    if (state !== 'idle') return;
    cancelledRef.current = false;

    setState('requesting-permission');
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) {
      setState('idle');
      onPermissionDenied?.();
      return;
    }

    // Allow recording while other audio is ducked; restore on stop.
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });

    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
      startedAtRef.current = Date.now();
      setState('recording');
    } catch (err) {
      setState('idle');
      await setAudioModeAsync({ allowsRecording: false });
      throw err;
    }
  }, [recorder, state, onPermissionDenied]);

  const stop = useCallback(
    async (opts?: { cancel?: boolean }) => {
      if (state !== 'recording') return;

      const cancel = opts?.cancel === true || cancelledRef.current;
      if (cancel) setState('cancelling');

      try {
        await recorder.stop();
      } finally {
        await setAudioModeAsync({ allowsRecording: false });
      }

      const elapsed = Date.now() - startedAtRef.current;
      const uri = recorder.uri;
      setState('idle');

      if (cancel || !uri || elapsed < minDurationMs) {
        onCancel?.();
        return;
      }
      onFinish?.({ uri, durationMs: elapsed });
    },
    [recorder, state, minDurationMs, onFinish, onCancel],
  );

  const cancelOnSlide = useCallback(() => {
    cancelledRef.current = true;
  }, []);

  return {
    state,
    elapsedMs: state === 'recording' ? Math.round((recorderState.durationMillis ?? 0)) : 0,
    start,
    stop,
    cancelOnSlide,
  };
}
