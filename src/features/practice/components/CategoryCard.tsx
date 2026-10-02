import React from 'react';
import { View, Pressable, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
 * Card kategori: gambar penuh (rasio 576x768) dengan judul overlay
 * gradient di bagian bawah.
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
      accessibilityLabel={`Start ${category.title} chat`}
      className={[
        'rounded-lg overflow-hidden bg-background-card shadow-card aspect-[3/4]',
        disabled || loading ? 'opacity-60' : 'active:opacity-90 active:scale-[0.98]',
      ].join(' ')}
    >
      {category.imageUrl ? (
        <Image source={{ uri: category.imageUrl }} className="absolute inset-0 w-full h-full" resizeMode="cover" />
      ) : (
        <View className="absolute inset-0 w-full h-full bg-primary-50 items-center justify-center">
          <Ionicons name="chatbubbles-outline" size={40} color={theme.colors.primary[300]} />
        </View>
      )}

      {/* Overlay gradient gelap di bawah untuk keterbacaan judul */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.75)']}
        locations={[0, 0.5, 1]}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' }}
      />

      <View className="absolute bottom-0 left-0 right-0 p-3">
        <Text
          variant="subtitle"
          weight="bold"
          className="text-white"
          style={{
            textShadowColor: 'rgba(0,0,0,0.5)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 3,
          }}
          numberOfLines={2}
        >
          {category.title}
        </Text>
      </View>

      {loading ? (
        <View className="absolute inset-0 bg-black/40 items-center justify-center">
          <ActivityIndicator size="small" color={theme.colors.text.inverse} />
        </View>
      ) : null}
    </Pressable>
  );
};
