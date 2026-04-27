import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
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
        <Stack.Screen name="transaction/[id]" options={{ title: 'Detalle de Transacción' }} />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
