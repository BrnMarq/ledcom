import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/context/AuthContext';
import { useRouter, Link } from 'expo-router';
import { LogIn } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: 'process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID',
    iosClientId: 'process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID',
    androidClientId: 'process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.idToken) {
        handleGoogleLogin(authentication.idToken);
      }
    }
  }, [response]);

  const handleGoogleLogin = async (idToken: string) => {
    setLoading(true);
    try {
      await signInWithGoogle(idToken);
      router.replace('/');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Error al iniciar sesión con Google';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      router.replace('/');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Error al iniciar sesión';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 p-6 justify-center">
        <View className="items-center mb-10">
          <View className="bg-emerald-500 p-5 rounded-3xl mb-4">
            <LogIn color="#fff" size={40} />
          </View>
          <Text className="text-3xl font-black text-gray-900">Bienvenido</Text>
          <Text className="text-gray-500 mt-2">Inicia sesión para continuar</Text>
        </View>

        <View className="space-y-4">
          <View>
            <Text className="text-gray-700 font-bold mb-2 ml-1">Email</Text>
            <TextInput
              className="bg-white p-4 rounded-2xl border border-gray-200 text-gray-800"
              placeholder="tu@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View className="mt-4">
            <Text className="text-gray-700 font-bold mb-2 ml-1">Contraseña</Text>
            <TextInput
              className="bg-white p-4 rounded-2xl border border-gray-200 text-gray-800"
              placeholder="********"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            className="bg-emerald-500 p-5 rounded-2xl mt-8 flex-row justify-center items-center shadow-lg"
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-lg">Iniciar Sesión</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            className="bg-white p-5 rounded-2xl mt-4 flex-row justify-center items-center shadow-sm border border-gray-200"
            onPress={() => promptAsync()}
            disabled={!request || loading}
          >
            <Text className="text-gray-800 font-bold text-lg">Continuar con Google</Text>
          </TouchableOpacity>
        </View>

        <View className="mt-10 flex-row justify-center">
          <Text className="text-gray-500">¿No tienes cuenta? </Text>
          <Link href={"/auth/register" as any} asChild>
            <TouchableOpacity>
              <Text className="text-emerald-600 font-bold">Regístrate</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
