import 'react-native-gesture-handler';
import './global.css';
import React, { useEffect, useState } from 'react';
import { installLiveKitGlobals } from '@/features/call/livekit/installLiveKit';

installLiveKitGlobals();
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { getServices, AppServices } from '@/core/di/ServiceContainer';
import { AuthProvider } from '@/features/auth/AuthContext';
import { RootNavigator } from '@/core/navigation/RootNavigator';
import { linking } from '@/core/navigation/linking';
import { ErrorBoundary } from '@/ui/components/ErrorBoundary';
import { ErrorState } from '@/ui/components/States';
import { userMessageForError } from '@/core/errors/errorMessage';

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
      <View className="flex-1 justify-center items-center bg-background-main p-6">
        <ErrorState title="Failed to start the app" message={bootError.message} requestId={bootError.requestId} />
      </View>
    );
  }

  if (!services) {
    return <View className="flex-1 justify-center items-center bg-background-main p-6" />;
  }

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}
