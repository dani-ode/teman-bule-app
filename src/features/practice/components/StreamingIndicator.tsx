import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, View, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/ui/components/Text';
import { theme } from '@/ui/theme';

export interface StreamingIndicatorProps {
  readonly stage: 'connecting' | 'transcribing' | 'generating' | 'processing' | null;
  readonly streamingText: string | null;
  readonly agentName: string;
}

const stageConfig = {
  connecting: { icon: 'cloud-outline' as const, label: (name: string) => `Connecting to ${name}...`, showSpinner: true },
  transcribing: { icon: 'mic-outline' as const, label: () => 'Transcribing voice...', showSpinner: true },
  generating: { icon: 'create-outline' as const, label: (name: string) => `${name} is thinking...`, showSpinner: true },
  processing: { icon: 'checkmark-circle-outline' as const, label: () => 'Processing audio...', showSpinner: false },
};

export const StreamingIndicator: React.FC<StreamingIndicatorProps> = ({ stage, streamingText, agentName }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, [fadeAnim]);

  if (!stage) return null;
  const config = stageConfig[stage];

  return (
    <Animated.View style={{ opacity: fadeAnim }} className="mx-3 mb-2">
      <View className="bg-background-card rounded-lg border border-khaki-200 p-3 shadow-sm">
        <View className="flex-row items-center gap-2">
          {config.showSpinner ? (
            <ActivityIndicator size="small" color={theme.colors.primary[600]} />
          ) : (
            <Ionicons name={config.icon} size={18} color={theme.colors.primary[600]} />
          )}
          <Text variant="caption" color="secondary" className="flex-1">{config.label(agentName)}</Text>
        </View>
        {streamingText && stage === 'processing' ? (
          <View className="mt-2 pt-2 border-t border-khaki-200">
            <Text variant="caption" color="muted" className="italic" numberOfLines={2}>{streamingText}</Text>
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
};
