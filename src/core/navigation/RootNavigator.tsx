import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { AuthNavigator } from './AuthNavigator';
import { MainTabsNavigator } from './MainTabsNavigator';
import { useAuth } from '@/features/auth/AuthContext';
import { LoadingSpinner } from '@/ui/components/LoadingSpinner';
import { theme } from '@/ui/theme';

const RootStack = createNativeStackNavigator<RootStackParamList>();

/**
 * Root: bootstrap config → session restore → auth stack or main stack.
 * Switching is driven by authoritative auth state, not local flags.
 */
export const RootNavigator: React.FC = () => {
  const { state } = useAuth();

  if (state.status === 'bootstrapping') {
    return (
      <View style={styles.bootstrap} accessibilityLabel="Memuat aplikasi">
        <LoadingSpinner message="Memuat..." />
      </View>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {state.status === 'authenticated' ? (
        <RootStack.Screen name="Main" component={MainTabsNavigator} />
      ) : (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
};

const styles = StyleSheet.create({
  bootstrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.main,
  },
});
