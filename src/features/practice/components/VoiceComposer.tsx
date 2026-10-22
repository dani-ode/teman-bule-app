import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Pressable, TextInput, Animated, Easing, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  requestNotificationPermissionsAsync,
  requestRecordingPermissionsAsync,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { theme } from '@/ui/theme';
import { Text } from '@/ui/components/Text';
import { AudioWaveformPlayer } from '@/ui/components/AudioWaveformPlayer';

const TAG = '[VoiceComposer]';

function log(event: string, detail?: Record<string, unknown>): void {
  if (detail) {
    console.log(`${TAG} ${event}`, JSON.stringify(detail));
  } else {
    console.log(`${TAG} ${event}`);
  }
}

export interface VoiceComposerProps {
  readonly onSendText: (text: string) => void;
  readonly onSendVoice: (uri: string, durationMs: number) => void;
  /** Dipanggil saat mulai merekam agar screen bisa menghentikan audio chat. */
  readonly onStartRecording?: () => void;
  readonly disabled?: boolean;
  /** Toggle buka/tutup section reply suggestions di atas composer. */
  readonly onToggleSuggestions?: () => void;
  /** Highlight tombol suggestions saat section sedang terbuka. */
  readonly suggestionsActive?: boolean;
  /** Disable tombol suggestions (mis. saat request sedang berjalan). */
  readonly suggestionsDisabled?: boolean;
}

const BAR_COUNT = 5;
const MIN_DURATION_MS = 600;

/**
 * Voice-first message composer dengan toggle ke text input.
 * Hold-to-speak dengan visual sound bars berdasarkan metering.
 */
export const VoiceComposer: React.FC<VoiceComposerProps> = ({
  onSendText,
  onSendVoice,
  onStartRecording,
  disabled = false,
  onToggleSuggestions,
  suggestionsActive = false,
  suggestionsDisabled = false,
}) => {
  const [mode, setMode] = useState<'voice' | 'text'>('voice');
  const [textInput, setTextInput] = useState('');
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Audio recorder dengan metering enabled.
  // HAPUS audioSource eksplisit — 'voice_communication' bisa menyebabkan
  // mic diputus oleh echo cancellation Android setelah beberapa detik.
  // Gunakan default (mic) yang lebih stabil.
  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });
  const recorderState = useAudioRecorderState(recorder, 100);

  // Track perubahan recorder state untuk debug
  const prevRecorderStateRef = useRef(recorderState);
  useEffect(() => {
    const prev = prevRecorderStateRef.current;
    if (prev.isRecording !== recorderState.isRecording) {
      log('recorderState.isRecording changed', {
        from: prev.isRecording,
        to: recorderState.isRecording,
        durationMillis: recorderState.durationMillis,
        metering: recorderState.metering,
      });
    }
    if (prev.durationMillis !== recorderState.durationMillis && recorderState.isRecording) {
      // Log setiap 1 detik untuk melacak metering
      if (Math.floor(recorderState.durationMillis / 1000) !== Math.floor(prev.durationMillis / 1000)) {
        const metering = recorderState.metering;
        const isSilent = metering === -160;
        log('recording tick', {
          durationSec: Math.floor(recorderState.durationMillis / 1000),
          metering,
          isSilent,
          // Warning jika metering turun drastis (indikasi mic terputus)
          ...(isSilent && prev.metering !== -160 && { warning: 'METERING_DROP' }),
        });
      }
    }
    prevRecorderStateRef.current = recorderState;
  }, [recorderState]);

  // Player untuk memutar ulang rekaman sebelum dikirim. Source berubah sesuai
  // recordedUri; useAudioPlayer menangani release/recreate secara internal.
  const previewPlayer = useAudioPlayer(recordedUri);
  const previewStatus = useAudioPlayerStatus(previewPlayer);

  // Saat preview selesai: pause agar playWhenReady native turun. JANGAN
  // seekTo(0) di sini — di ExoPlayer seek saat ENDED tetap playWhenReady=true
  // → auto-replay (loop). Posisi di-reset saat user menekan play lagi.
  useEffect(() => {
    if (previewStatus.didJustFinish) {
      log('preview didJustFinish → pause');
      try {
        previewPlayer.pause();
      } catch (e) {
        log('preview pause after finish failed', { error: String(e) });
      }
    }
  }, [previewStatus.didJustFinish, previewPlayer]);

  // Monitor preview player status saat recording untuk deteksi interference
  useEffect(() => {
    if (recorderState.isRecording && previewStatus.playing) {
      log('WARNING: preview playing during recording!', {
        previewPlaying: previewStatus.playing,
        previewCurrentTime: previewStatus.currentTime,
      });
    }
  }, [recorderState.isRecording, previewStatus.playing, previewStatus.currentTime]);

  const isPreviewPlaying = previewStatus.playing;
  // Progress preview 0..1 untuk waveform fill
  const previewProgress = previewStatus.duration > 0 ? previewStatus.currentTime / previewStatus.duration : 0;

  // Animation values untuk sound bars
  const barAnimations = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.3))
  ).current;

  // Update sound bars berdasarkan metering level
  useEffect(() => {
    if (recorderState.isRecording && recorderState.metering !== undefined) {
      // Normalize metering (-160 to 0 dB) ke 0-1 range
      const level = Math.max(0, Math.min(1, (recorderState.metering + 60) / 60));

      barAnimations.forEach((anim, index) => {
        // Randomize sedikit untuk efek natural
        const variance = 0.2 + Math.random() * 0.3;
        const targetValue = Math.min(1, level * (1 + variance * (index % 2 === 0 ? 1 : -0.5)));

        Animated.timing(anim, {
          toValue: Math.max(0.2, targetValue),
          duration: 100,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }).start();
      });
    } else if (!recorderState.isRecording) {
      // Reset bars saat tidak recording
      barAnimations.forEach((anim) => {
        Animated.timing(anim, {
          toValue: 0.3,
          duration: 200,
          useNativeDriver: false,
        }).start();
      });
    }
  }, [recorderState.isRecording, recorderState.metering, barAnimations]);

  const startRecording = useCallback(async () => {
    log('startRecording called', { disabled });
    if (disabled) return;

    log('requesting permission...');
    const perm = await requestRecordingPermissionsAsync();
    log('permission result', { granted: perm.granted });
    if (!perm.granted) {
      console.warn('Recording permission denied');
      return;
    }

    // allowsBackgroundRecording menjalankan foreground service yang wajib punya
    // izin POST_NOTIFICATIONS di Android 13+. Tanpa izin ini prepareToRecordAsync
    // akan reject. Minta izinnya lebih dulu; jika ditolak, lanjutkan recording
    // tanpa foreground service.
    let allowsBackgroundRecording = false;
    if (Platform.OS === 'android') {
      const notifPerm = await requestNotificationPermissionsAsync();
      allowsBackgroundRecording = notifPerm.granted;
      log('notification permission result', {
        granted: notifPerm.granted,
        allowsBackgroundRecording,
      });
    }

    // Hentikan audio chat yang sedang diputar agar tidak ikut terekam.
    log('stopping conversation audio via onStartRecording');
    onStartRecording?.();

    // Hentikan preview rekaman lama bila masih berbunyi.
    log('preview status before record', {
      playing: previewStatus.playing,
      didJustFinish: previewStatus.didJustFinish,
    });
    try {
      if (previewStatus.playing) {
        previewPlayer.pause();
        log('preview paused before record');
      }
    } catch (e) {
      log('pause preview before record failed', { error: String(e) });
    }

    // Konfigurasi audio mode untuk recording.
    // PENTING: Gunakan 'mixWithOthers' agar recorder tidak request audio focus.
    // 'doNotMix' memicu requestAudioFocus() yang bisa menyebabkan mic terputus
    // saat ada audio focus change (notifikasi, sistem suara, dll).
    //
    // allowsBackgroundRecording: true memakai foreground service agar sistem
    // tidak memutus mic saat recording berlangsung. Hanya aktifkan bila izin
    // POST_NOTIFICATIONS sudah diberikan (Android 13+).
    log('setting audio mode for recording', {
      platform: Platform.OS,
      allowsRecording: true,
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
      allowsBackgroundRecording,
    });
    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
      // Foreground service menjaga mic tetap aktif
      allowsBackgroundRecording,
    });
    log('audio mode set');

    try {
      log('prepareToRecordAsync...');
      await recorder.prepareToRecordAsync();
      log('prepareToRecordAsync done, calling record()...');
      recorder.record();
      log('record() called', {
        isRecording: recorderState.isRecording,
        uri: recorder.uri,
      });
      setRecordedUri(null);
      setRecordingDuration(0);
    } catch (err) {
      log('start recording failed', { error: String(err) });
      console.error('Failed to start recording:', err);
      await setAudioModeAsync({ allowsRecording: false });
    }
  }, [recorder, disabled, onStartRecording, previewPlayer, previewStatus.playing, recorderState.isRecording]);

  const stopRecording = useCallback(async () => {
    log('stopRecording called', {
      isRecording: recorderState.isRecording,
      durationMillis: recorderState.durationMillis,
    });
    if (!recorderState.isRecording) {
      log('stopRecording early return: not recording');
      return;
    }

    try {
      log('recorder.stop()...');
      await recorder.stop();
      log('recorder.stop() done', { uri: recorder.uri });

      log('setting audio mode back to non-recording');
      await setAudioModeAsync({
        allowsRecording: false,
        interruptionMode: 'mixWithOthers',
        allowsBackgroundRecording: false,
      });
      log('audio mode reset');

      const uri = recorder.uri;
      const duration = recorderState.durationMillis ?? 0;
      log('stop result', { uri, duration, minDuration: MIN_DURATION_MS });

      if (uri && duration >= MIN_DURATION_MS) {
        log('recording accepted', { duration });
        setRecordedUri(uri);
        setRecordingDuration(duration);
      } else {
        log('recording too short, discarded', { duration, minDuration: MIN_DURATION_MS });
        setRecordedUri(null);
        setRecordingDuration(0);
      }
    } catch (err) {
      log('stop recording failed', { error: String(err) });
      console.error('Failed to stop recording:', err);
    }
  }, [recorder, recorderState.isRecording, recorderState.durationMillis]);

  // Tap-to-start / tap-to-stop (lebih andal daripada hold-to-record,
  // karena onPressOut sering tidak terkirim di emulator/perangkat).
  const toggleRecording = useCallback(() => {
    log('toggleRecording called', {
      disabled,
      isRecording: recorderState.isRecording,
      hasVoiceRecorded: recordedUri !== null,
    });
    if (disabled) return;
    if (recorderState.isRecording) {
      void stopRecording();
    } else {
      void startRecording();
    }
  }, [disabled, recorderState.isRecording, startRecording, stopRecording, recordedUri]);

  const handleSendVoice = useCallback(() => {
    log('handleSendVoice called', {
      hasRecordedUri: recordedUri !== null,
      recordingDuration,
    });
    if (recordedUri && recordingDuration > 0) {
      // Stop preview agar tidak lanjut berbunyi setelah rekaman dikirim.
      try {
        if (previewStatus.playing) {
          previewPlayer.pause();
          log('preview paused on send');
        }
      } catch (e) {
        log('pause preview on send failed', { error: String(e) });
      }
      onSendVoice(recordedUri, recordingDuration);
      setRecordedUri(null);
      setRecordingDuration(0);
    }
  }, [recordedUri, recordingDuration, onSendVoice, previewPlayer, previewStatus.playing]);
  const handleSendText = useCallback(() => {
    const trimmed = textInput.trim();
    if (trimmed.length > 0 && !disabled) {
      onSendText(trimmed);
      setTextInput('');
    }
  }, [textInput, disabled, onSendText]);

  const handleDeleteVoice = useCallback(() => {
    log('handleDeleteVoice called');
    if (previewStatus.playing) {
      previewPlayer.pause();
      log('preview paused on delete');
    }
    void previewPlayer.seekTo(0);
    setRecordedUri(null);
    setRecordingDuration(0);
  }, [previewPlayer, previewStatus.playing]);

  const handleTogglePreview = useCallback(() => {
    log('handleTogglePreview called', {
      hasRecordedUri: recordedUri !== null,
      playing: previewStatus.playing,
      currentTime: previewStatus.currentTime,
      duration: previewStatus.duration,
    });
    if (!recordedUri) return;

    try {
      if (previewStatus.playing) {
        log('preview pause');
        previewPlayer.pause();
      } else {
        log('preview play', { uri: recordedUri.slice(-24) });
        // Hentikan audio chat agar tidak bertumpuk dengan preview.
        onStartRecording?.();
        // Bila sudah di akhir, mundur ke awal sebelum play agar replay dari 0.
        const dur = previewPlayer.duration;
        const cur = previewPlayer.currentTime;
        if (dur > 0 && cur >= dur - 0.1) {
          void previewPlayer.seekTo(0);
        }
        previewPlayer.play();
      }
    } catch (e) {
      log('preview toggle failed', { error: String(e) });
    }
  }, [recordedUri, previewPlayer, previewStatus.playing, previewStatus.currentTime, previewStatus.duration, onStartRecording]);

  const toggleMode = useCallback(() => {
    log('toggleMode called', { currentMode: mode });
    setMode((prev) => (prev === 'voice' ? 'text' : 'voice'));
    // Clear states saat switch
    if (previewStatus.playing) {
      previewPlayer.pause();
      log('preview paused on mode toggle');
    }
    void previewPlayer.seekTo(0);
    setTextInput('');
    setRecordedUri(null);
    setRecordingDuration(0);
  }, [previewPlayer, previewStatus.playing, mode]);

  const isRecording = recorderState.isRecording;
  const hasVoiceRecorded = recordedUri !== null;
  const canSendText = textInput.trim().length > 0 && !disabled;

  // Format duration display
  const formatDuration = (ms: number): string => {
    const totalSec = Math.round(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View className="bg-background-card border-t border-khaki-200 px-3 py-2">
      {/* Sound bars visualization saat recording */}
      {isRecording && (
        <View className="flex-row items-center justify-center gap-1 h-10 mb-2">
          {barAnimations.map((anim, index) => (
            <Animated.View
              key={index}
              className="w-1 bg-primary-500 rounded-full"
              style={{
                height: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['20%', '100%'],
                }),
                opacity: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.4, 1],
                }),
              }}
            />
          ))}
          <Text variant="caption" color="secondary" className="ml-2">
            {formatDuration(recorderState.durationMillis ?? 0)}
          </Text>
        </View>
      )}

      {/* Voice preview setelah recording */}
      {hasVoiceRecorded && !isRecording && (
        <View className="flex-row items-center bg-khaki-100 rounded-lg px-3 py-2 mb-2">
          <View className="flex-1">
            <AudioWaveformPlayer
              uri={recordedUri}
              durationMs={recordingDuration}
              playing={isPreviewPlaying}
              progress={previewProgress}
              onToggle={handleTogglePreview}
              variant="ai"
            />
          </View>
          <Pressable
            onPress={handleDeleteVoice}
            hitSlop={8}
            accessibilityLabel="Delete voice message"
            className="p-1 ml-2"
          >
            <Ionicons name="trash-outline" size={20} color={theme.colors.semantic.error} />
          </Pressable>
        </View>
      )}

      {/* Text input mode */}
      {mode === 'text' && (
        <View className="flex-row items-end mb-2">
          <View className="flex-1 bg-khaki-100 rounded-lg border border-khaki-200">
            <TextInput
              value={textInput}
              onChangeText={setTextInput}
              placeholder="Write a message..."
              placeholderTextColor={theme.colors.text.muted}
              editable={!disabled}
              multiline
              accessibilityLabel="Write a message"
              className="px-3 py-2 text-base text-ink-primary max-h-[100px]"
            />
          </View>
        </View>
      )}

      {/* Action buttons */}
      <View className="flex-row items-center justify-between">
        {/* Left side: mode toggle + suggestions toggle */}
        <View className="flex-row items-center gap-1">
          <Pressable
            onPress={toggleMode}
            disabled={disabled || isRecording}
            accessibilityRole="button"
            accessibilityLabel={mode === 'voice' ? 'Switch to text input' : 'Switch to voice input'}
            className={[
              'w-11 h-11 rounded-full items-center justify-center',
              disabled || isRecording ? 'opacity-40' : 'active:opacity-80',
            ].join(' ')}
          >
            <Ionicons
              name={mode === 'voice' ? 'chatbox-outline' : 'mic-outline'}
              size={22}
              color={theme.colors.primary[600]}
            />
          </Pressable>

          {onToggleSuggestions ? (
            <Pressable
              onPress={onToggleSuggestions}
              disabled={disabled || suggestionsDisabled}
              accessibilityRole="button"
              accessibilityLabel={suggestionsActive ? 'Hide reply suggestions' : 'Show reply suggestions'}
              accessibilityState={{ disabled: disabled || suggestionsDisabled, selected: suggestionsActive }}
              className={[
                'w-11 h-11 rounded-full items-center justify-center',
                suggestionsActive ? 'bg-accent-100 border border-accent-300' : '',
                disabled || suggestionsDisabled ? 'opacity-40' : 'active:opacity-80',
              ].join(' ')}
            >
              <Ionicons
                name={suggestionsActive ? 'bulb' : 'bulb-outline'}
                size={22}
                color={suggestionsActive ? theme.colors.accent[600] : theme.colors.primary[600]}
              />
            </Pressable>
          ) : null}
        </View>

        {/* Center: main action button */}
        {mode === 'voice' ? (
          <Pressable
            onPress={toggleRecording}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
            accessibilityState={{ disabled }}
            className={[
              'w-16 h-16 rounded-full items-center justify-center shadow-elevated',
              isRecording
                ? 'bg-danger scale-110'
                : hasVoiceRecorded
                  ? 'bg-success'
                  : 'bg-primary-600',
              disabled ? 'opacity-40' : 'active:opacity-90',
            ].join(' ')}
          >
            <Ionicons
              name={isRecording ? 'stop' : hasVoiceRecorded ? 'checkmark' : 'mic'}
              size={28}
              color={theme.colors.text.inverse}
            />
          </Pressable>
        ) : (
          <View className="w-16" /> // Spacer untuk konsistensi layout
        )}

        {/* Right side: send button */}
        <Pressable
          onPress={mode === 'voice' ? handleSendVoice : handleSendText}
          disabled={
            disabled ||
            (mode === 'voice' ? !hasVoiceRecorded : !canSendText)
          }
          accessibilityRole="button"
          accessibilityLabel="Send message"
          accessibilityState={{
            disabled:
              disabled ||
              (mode === 'voice' ? !hasVoiceRecorded : !canSendText),
          }}
          className={[
            'w-11 h-11 rounded-full items-center justify-center',
            (mode === 'voice' ? hasVoiceRecorded : canSendText) && !disabled
              ? 'bg-primary-600 active:opacity-80'
              : 'bg-khaki-300',
          ].join(' ')}
        >
          <Ionicons
            name="send"
            size={20}
            color={
              (mode === 'voice' ? hasVoiceRecorded : canSendText) && !disabled
                ? theme.colors.text.inverse
                : theme.colors.text.muted
            }
          />
        </Pressable>
      </View>

      {/* Helper text */}
      {!isRecording && !hasVoiceRecorded && mode === 'voice' && (
        <Text variant="caption" color="muted" align="center" className="mt-2">
          Tap the microphone to start recording, tap again to stop
        </Text>
      )}
    </View>
  );
};
