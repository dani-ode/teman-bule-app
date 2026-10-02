import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Pressable, TextInput, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  requestRecordingPermissionsAsync,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { theme } from '@/ui/theme';
import { Text } from '@/ui/components/Text';

export interface VoiceComposerProps {
  readonly onSendText: (text: string) => void;
  readonly onSendVoice: (uri: string, durationMs: number) => void;
  readonly disabled?: boolean;
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
  disabled = false,
}) => {
  const [mode, setMode] = useState<'voice' | 'text'>('voice');
  const [textInput, setTextInput] = useState('');
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Audio recorder dengan metering enabled
  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });
  const recorderState = useAudioRecorderState(recorder, 100);

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
    if (disabled) return;

    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) {
      console.warn('Recording permission denied');
      return;
    }

    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });

    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecordedUri(null);
      setRecordingDuration(0);
    } catch (err) {
      console.error('Failed to start recording:', err);
      await setAudioModeAsync({ allowsRecording: false });
    }
  }, [recorder, disabled]);

  const stopRecording = useCallback(async () => {
    if (!recorderState.isRecording) return;

    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });

      const uri = recorder.uri;
      const duration = recorderState.durationMillis ?? 0;

      if (uri && duration >= MIN_DURATION_MS) {
        setRecordedUri(uri);
        setRecordingDuration(duration);
      } else {
        // Recording terlalu pendek, discard
        setRecordedUri(null);
        setRecordingDuration(0);
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
    }
  }, [recorder, recorderState.isRecording, recorderState.durationMillis]);

  const handleSendVoice = useCallback(() => {
    if (recordedUri && recordingDuration > 0) {
      onSendVoice(recordedUri, recordingDuration);
      setRecordedUri(null);
      setRecordingDuration(0);
    }
  }, [recordedUri, recordingDuration, onSendVoice]);

  const handleSendText = useCallback(() => {
    const trimmed = textInput.trim();
    if (trimmed.length > 0 && !disabled) {
      onSendText(trimmed);
      setTextInput('');
    }
  }, [textInput, disabled, onSendText]);

  const handleDeleteVoice = useCallback(() => {
    setRecordedUri(null);
    setRecordingDuration(0);
  }, []);

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'voice' ? 'text' : 'voice'));
    // Clear states saat switch
    setTextInput('');
    setRecordedUri(null);
    setRecordingDuration(0);
  }, []);

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
          <Ionicons name="mic" size={20} color={theme.colors.primary[600]} />
          <Text variant="body" className="flex-1 ml-2">
            Voice message ({formatDuration(recordingDuration)})
          </Text>
          <Pressable
            onPress={handleDeleteVoice}
            hitSlop={8}
            accessibilityLabel="Delete voice message"
            className="p-1"
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
        {/* Left side: mode toggle */}
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

        {/* Center: main action button */}
        {mode === 'voice' ? (
          <Pressable
            onPressIn={startRecording}
            onPressOut={stopRecording}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={isRecording ? 'Release to stop recording' : 'Hold to record'}
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
          Hold the microphone button to record
        </Text>
      )}
    </View>
  );
};
