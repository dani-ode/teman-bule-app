import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/ui/theme';
import { Text } from '@/ui/components/Text';

export interface SuggestionCarouselProps {
  /** Opsi kalimat suggestion (biasanya 3) dari backend. */
  readonly suggestions: ReadonlyArray<string>;
  readonly loading?: boolean;
  /** Pesan error ramah-user saat fetch gagal; menampilkan tombol retry. */
  readonly errorMessage?: string | null;
  readonly onRetry?: () => void;
  /** Tutup section (kembali ke keadaan hidden). */
  readonly onClose: () => void;
}

/**
 * Section suggestions (bukan bubble chat): carousel horizontal berisi 3 opsi
 * kalimat yang bisa dibaca user sebagai panduan saat merekam voice message.
 * Ditampilkan di atas composer; bisa di-hide lewat onClose.
 */
export const SuggestionCarousel: React.FC<SuggestionCarouselProps> = ({
  suggestions,
  loading = false,
  errorMessage = null,
  onRetry,
  onClose,
}) => {
  const [cardWidth, setCardWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<string>>(null);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setCardWidth(event.nativeEvent.layout.width);
  }, []);

  const handleMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (cardWidth <= 0) return;
      const index = Math.round(event.nativeEvent.contentOffset.x / cardWidth);
      setActiveIndex(Math.max(0, Math.min(index, suggestions.length - 1)));
    },
    [cardWidth, suggestions.length],
  );

  return (
    <View
      className="mx-3 mb-2 bg-background-card border border-khaki-200 rounded-lg shadow-card overflow-hidden"
      onLayout={handleLayout}
    >
      {/* Header: label + tombol hide */}
      <View className="flex-row items-center justify-between pl-3 pr-1 py-1 border-b border-khaki-200">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="bulb-outline" size={15} color={theme.colors.accent[600]} />
          <Text variant="caption" weight="semibold" color="secondary">
            Need ideas? Try saying one of these
          </Text>
        </View>
        <Pressable
          onPress={onClose}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Hide suggestions"
          className="p-1.5 active:opacity-70"
        >
          <Ionicons name="chevron-down" size={18} color={theme.colors.text.muted} />
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-row items-center justify-center gap-2 px-4 py-5">
          <ActivityIndicator size="small" color={theme.colors.primary[600]} />
          <Text variant="caption" color="muted">
            Generating suggestions...
          </Text>
        </View>
      ) : errorMessage ? (
        <View className="flex-row items-center gap-2 px-4 py-3">
          <Ionicons name="alert-circle-outline" size={16} color={theme.colors.semantic.error} />
          <Text variant="caption" color="secondary" className="flex-1">
            {errorMessage}
          </Text>
          {onRetry ? (
            <Pressable
              onPress={onRetry}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Retry loading suggestions"
              className="flex-row items-center gap-1 active:opacity-70"
            >
              <Ionicons name="refresh" size={14} color={theme.colors.primary[600]} />
              <Text variant="caption" weight="bold" className="text-primary-600">
                Retry
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : suggestions.length > 0 && cardWidth > 0 ? (
        <>
          <FlatList
            ref={listRef}
            data={suggestions as string[]}
            keyExtractor={(_, index) => `suggestion-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleMomentumEnd}
            getItemLayout={(_, index) => ({
              length: cardWidth,
              offset: cardWidth * index,
              index,
            })}
            renderItem={({ item, index }) => (
              <View style={{ width: cardWidth }} className="px-3 py-3">
                <View className="bg-khaki-100 border border-khaki-200 rounded-lg p-3 min-h-[72px]">
                  <View className="flex-row items-start gap-2">
                    <View className="w-5 h-5 rounded-full bg-accent-500 items-center justify-center mt-0.5">
                      <Text variant="caption" weight="bold" className="text-ink-inverse">
                        {index + 1}
                      </Text>
                    </View>
                    <Text variant="body" className="flex-1 text-[15px] leading-[21px] text-ink-primary">
                      {item}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          />

          {/* Pagination dots */}
          {suggestions.length > 1 ? (
            <View className="flex-row items-center justify-center gap-1.5 pb-2">
              {suggestions.map((_, index) => (
                <View
                  key={`dot-${index}`}
                  className={[
                    'rounded-full',
                    index === activeIndex ? 'w-4 h-1.5 bg-primary-600' : 'w-1.5 h-1.5 bg-khaki-300',
                  ].join(' ')}
                />
              ))}
            </View>
          ) : null}
        </>
      ) : (
        <View className="px-4 py-3">
          <Text variant="caption" color="muted" align="center">
            No suggestions available right now.
          </Text>
        </View>
      )}
    </View>
  );
};
