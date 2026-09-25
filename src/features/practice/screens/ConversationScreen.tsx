import React from 'react';
import { View, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChatStackParamList } from '@/core/navigation/types';
import {
  usePracticeMessages,
  usePracticeSession,
  useSendPracticeMessage,
  PendingMessage,
} from '../hooks/usePractice';
import { userMessageForError } from '@/core/errors/errorMessage';
import { Text } from '@/ui/components/Text';
import { LoadingSpinner } from '@/ui/components/LoadingSpinner';
import { ErrorState } from '@/ui/components/States';
import { ConversationMessage } from '@/domain/practice/practice.types';
import { theme } from '@/ui/theme';
import { MessageBubble } from '../components/MessageBubble';
import { MessageComposer } from '../components/MessageComposer';

type Props = NativeStackScreenProps<ChatStackParamList, 'Conversation'>;

export const ConversationScreen: React.FC<Props> = ({ route }) => {
  const { sessionId, agentCode } = route.params;
  const session = usePracticeSession(sessionId);
  const messages = usePracticeMessages(sessionId);
  const { pendingMessages, send, retry } = useSendPracticeMessage(sessionId);
  const [sendError, setSendError] = React.useState<string | null>(null);

  const handleSend = async (text: string) => {
    setSendError(null);
    try {
      await send(text);
    } catch (err) {
      setSendError(userMessageForError(err).message);
    }
  };

  const merged: (ConversationMessage | PendingMessage)[] = [
    ...(messages.data ?? []),
    ...pendingMessages,
  ].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const isClosed = session.data?.state !== undefined && session.data.state !== 'active';

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <Text variant="subtitle" weight="bold" style={styles.headerTitle}>
          {agentCode === 'elean' ? 'Elean' : 'Willy'}
        </Text>
        <Text variant="caption" color="secondary">
          {isClosed ? 'Sesi selesai' : 'Sesi aktif'}
        </Text>
      </View>

      {messages.isLoading ? (
        <View style={styles.center}>
          <LoadingSpinner message="Memuat riwayat..." />
        </View>
      ) : messages.isError ? (
        <ErrorState
          message={userMessageForError(messages.error).message}
          requestId={userMessageForError(messages.error).requestId}
          onRetry={() => messages.refetch()}
        />
      ) : (
        <FlatList
          data={merged}
          keyExtractor={(item) => item.messageId}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              onRetry={
                'pending' in item && item.failed
                  ? () => retry((item as PendingMessage).messageId)
                  : undefined
              }
            />
          )}
          ListEmptyComponent={
            <Text variant="body" color="secondary" style={styles.empty}>
              Mulai percakapan dengan mengirim pesan pertama Anda.
            </Text>
          }
        />
      )}

      {sendError ? (
        <View style={styles.sendErrorBox}>
          <Text variant="caption" style={styles.sendErrorText}>
            {sendError}
          </Text>
        </View>
      ) : null}

      <MessageComposer onSend={handleSend} disabled={isClosed} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background.main },
  header: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  headerTitle: { textTransform: 'capitalize' },
  center: { flex: 1, justifyContent: 'center' },
  list: { padding: theme.spacing.md, flexGrow: 1 },
  empty: { textAlign: 'center', marginTop: theme.spacing.xl },
  sendErrorBox: {
    backgroundColor: '#fee2e2',
    padding: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
    borderRadius: theme.radii.md,
    marginBottom: theme.spacing.xs,
  },
  sendErrorText: { color: theme.colors.semantic.error },
});
