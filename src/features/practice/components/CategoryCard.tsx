import React from 'react';
import { View, StyleSheet, Pressable, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PracticeCategory } from '@/domain/practice/practice.types';
import { Text } from '@/ui/components/Text';
import { theme } from '@/ui/theme';

export interface CategoryCardProps {
  readonly category: PracticeCategory;
  readonly onPress: (category: PracticeCategory) => void;
  readonly loading?: boolean;
  readonly disabled?: boolean;
}

/**
 * Card kategori: gambar penuh dengan judul overlay di bagian bawah.
 */
export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onPress,
  loading = false,
  disabled = false,
}) => {
  return (
    <Pressable
      onPress={() => onPress(category)}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={`Mulai chat kategori ${category.title}`}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
        (disabled || loading) && styles.cardDisabled,
      ]}
    >
      {category.imageUrl ? (
        <Image source={{ uri: category.imageUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.imageFallback]}>
          <Ionicons name="chatbubbles-outline" size={40} color={theme.colors.primary[300]} />
        </View>
      )}

      {/* Overlay gradient gelap di bawah untuk keterbacaan judul */}
      <View style={styles.overlay} />

      <View style={styles.titleContainer}>
        <Text variant="subtitle" weight="bold" style={styles.title} numberOfLines={2}>
          {category.title}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={theme.colors.text.inverse} />
        </View>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.background.card,
    ...theme.shadows.card,
    aspectRatio: 1,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  cardDisabled: {
    opacity: 0.6,
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    backgroundColor: theme.colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  titleContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.md,
  },
  title: {
    color: theme.colors.text.inverse,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
