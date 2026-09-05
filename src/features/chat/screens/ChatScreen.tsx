import React from 'react';
import { View, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { useChat } from '../hooks/useChat';
import { ChatBubble } from '../components/ChatBubble';
import { ChatInput } from '../components/ChatInput';
import { Text } from '@/ui/components/Text';
import { LoadingSpinner } from '@/ui/components/LoadingSpinner';
import { theme } from '@/ui/theme';

export const ChatScreen: React.FC = () => {
  const { messages, loading, sending, error, sendMessage } = useChat('sess_1001');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text variant="title" weight="bold">
          TemanBule AI Tutor
        </Text>
        <Text variant="caption" color="secondary">
          Real-time English Grammar Correction
        </Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text variant="caption" color="error">
            ⚠️ {error.message} (Code: {error.code})
          </Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.center}>
          <LoadingSpinner message="Connecting to TemanBule AI Tutor..." />
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ChatBubble message={item} />}
          contentContainerStyle={styles.listContent}
        />
      )}

      {sending ? (
        <View style={styles.sendingIndicator}>
          <LoadingSpinner message="TemanBule is typing & reviewing grammar..." />
        </View>
      ) : null}

      <ChatInput onSend={sendMessage} disabled={loading || sending} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background.main,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  listContent: {
    paddingVertical: theme.spacing.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: theme.spacing.md,
    margin: theme.spacing.md,
    borderRadius: theme.radii.md,
  },
  sendingIndicator: {
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.background.card,
  },
});
