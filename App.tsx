import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { getServices, AppServices } from '@/core/di/ServiceContainer';
import { AuthProvider } from '@/features/auth/AuthContext';
import { RootNavigator } from '@/core/navigation/RootNavigator';
import { linking } from '@/core/navigation/linking';
import { ErrorState } from '@/ui/components/States';
import { userMessageForError } from '@/core/errors/errorMessage';
import { theme } from '@/ui/theme';

/**
 * Composition root (App.tsx): providers + bootstrap.
 * - Builds the DI container (API mode) and per-session QueryClient.
 * - Restores the auth session before rendering the navigator.
 * - Configuration/bootstrap failures surface explicitly, never a mock fallback.
 */
export default function App() {
  const [services, setServices] = useState<AppServices | null>(null);
  const [bootError, setBootError] = useState<{ message: string; requestId: string | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      try {
        const built = getServices();
        await built.session.bootstrap();
        if (!cancelled) setServices(built);
      } catch (err) {
        if (!cancelled) setBootError(userMessageForError(err));
      }
    };
    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  if (bootError) {
    return (
      <View style={styles.boot}>
        <ErrorState title="Gagal memulai aplikasi" message={bootError.message} requestId={bootError.requestId} />
      </View>
    );
  }

  if (!services) {
    return <View style={styles.boot} />;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={services.queryClient}>
        <AuthProvider session={services.session}>
          <NavigationContainer linking={linking}>
            <StatusBar style="dark" />
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.main,
    padding: theme.spacing.xl,
  },
});
