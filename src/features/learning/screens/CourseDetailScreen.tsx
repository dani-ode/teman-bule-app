import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { HomeStackParamList } from '@/core/navigation/types';
import { Text } from '@/ui/components/Text';
import { EmptyState } from '@/ui/components/States';
import { theme } from '@/ui/theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'CourseDetail'>;

/**
 * Course detail: backend currently exposes lesson content by lesson id, but
 * there is no course->unit->lesson listing endpoint yet (FE-03). Surface this
 * explicitly rather than fabricating a route.
 */
export const CourseDetailScreen: React.FC<Props> = ({ route }) => {
  const { courseId } = route.params;
  return (
    <View style={styles.container}>
      <EmptyState
        title="Lesson list not available yet"
        message={`The unit/lesson structure for course ${courseId} is waiting for a content listing contract from the server (FE-03).`}
        icon="library-outline"
      />
      <View style={styles.noteContainer}>
        <Ionicons name="information-circle-outline" size={16} color={theme.colors.text.muted} />
        <Text variant="caption" color="muted" style={styles.note}>
          Materials can be opened directly using the published lesson ID.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: theme.colors.background.main,
    padding: theme.spacing.lg,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  note: {
    textAlign: 'center',
  },
});
