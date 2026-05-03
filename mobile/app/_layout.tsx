import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = (segments[0] as string) === 'auth';

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated and not in auth group
      router.replace('/auth/login' as any);
    } else if (user && inAuthGroup) {
      // Redirect to home if authenticated and in auth group
      router.replace('/');
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#10B981', // Emerald 500
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Mis Cuentas' }} />
      <Stack.Screen name="account/[id]/index" options={{ title: 'Historial' }} />
      <Stack.Screen name="account/[id]/scanner" options={{ title: 'Scanner AI' }} />
      <Stack.Screen name="transaction/[id]" options={{ title: 'Detalle' }} />
      <Stack.Screen name="auth/login" options={{ headerShown: false }} />
      <Stack.Screen name="auth/register" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
      <StatusBar style="light" />
    </AuthProvider>
  );
}
