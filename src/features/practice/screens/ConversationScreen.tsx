import React from 'react';
import { View, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ChatStackParamList } from '@/core/navigation/types';
import {
  usePracticeMessages,
  usePracticeSession,
  useSendPracticeMessage,
  PendingMessage,
} from '../hooks/usePractice';
import { mergeMessages, MergedMessage } from '../hooks/messageReducer';
import { userMessageForError } from '@/core/errors/errorMessage';
import { Text } from '@/ui/components/Text';
import { LoadingSpinner } from '@/ui/components/LoadingSpinner';
import { ErrorState, EmptyState } from '@/ui/components/States';
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

  const merged: MergedMessage[] = mergeMessages(messages.data ?? [], pendingMessages);

  const isClosed = session.data?.state !== undefined && session.data.state !== 'active';

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <View style={styles.headerAvatar}>
          <Ionicons
            name={agentCode === 'elean' ? 'woman' : 'man'}
            size={20}
            color={theme.colors.text.inverse}
          />
        </View>
        <View style={styles.headerInfo}>
          <Text variant="subtitle" weight="bold" style={styles.headerTitle}>
            {agentCode === 'elean' ? 'Elean' : 'Willy'}
          </Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, isClosed ? styles.statusDotClosed : styles.statusDotActive]} />
            <Text variant="caption" color="secondary">
              {isClosed ? 'Sesi selesai' : 'Sesi aktif'}
            </Text>
          </View>
        </View>
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
            <EmptyState
              title="Mulai percakapan"
              message="Kirim pesan pertama Anda untuk memulai latihan."
              icon="chatbubble-ellipses-outline"
            />
          }
        />
      )}

      {sendError ? (
        <View style={styles.sendErrorBox}>
          <Ionicons name="alert-circle" size={16} color={theme.colors.semantic.error} />
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.khaki[200],
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: { textTransform: 'capitalize' },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotActive: {
    backgroundColor: theme.colors.semantic.success,
  },
  statusDotClosed: {
    backgroundColor: theme.colors.text.muted,
  },
  center: { flex: 1, justifyContent: 'center' },
  list: { padding: theme.spacing.md, flexGrow: 1 },
  sendErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: '#f5e0dc',
    padding: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
    borderRadius: theme.radii.md,
    marginBottom: theme.spacing.xs,
  },
  sendErrorText: { color: theme.colors.semantic.error, flex: 1 },
});
