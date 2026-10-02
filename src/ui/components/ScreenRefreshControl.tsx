import React, { useCallback, useState } from 'react';
import { RefreshControl, RefreshControlProps } from 'react-native';
import { theme } from '@/ui/theme';

interface ScreenRefreshControlProps extends Omit<RefreshControlProps, 'refreshing' | 'onRefresh'> {
  readonly onRefresh: () => Promise<unknown> | void;
}

/**
 * RefreshControl with consistent theme colors.
 * Manages the refreshing state internally so usage stays a single line.
 */
export const ScreenRefreshControl: React.FC<ScreenRefreshControlProps> = ({
  onRefresh,
  ...rest
}) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={() => void handleRefresh()}
      tintColor={theme.colors.primary[600]}
      colors={[theme.colors.primary[600]]}
      progressBackgroundColor={theme.colors.background.card}
      {...rest}
    />
  );
};
