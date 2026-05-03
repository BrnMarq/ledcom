import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter, Link } from 'expo-router';
import { UserPlus, ArrowLeft } from 'lucide-react-native';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password);
      router.replace('/');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Error al registrarse';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 p-6">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft color="#111827" size={24} />
        </TouchableOpacity>

        <View className="items-center mb-10">
          <View className="bg-emerald-500 p-5 rounded-3xl mb-4">
            <UserPlus color="#fff" size={40} />
          </View>
          <Text className="text-3xl font-black text-gray-900">Crear Cuenta</Text>
          <Text className="text-gray-500 mt-2">Únete para gestionar tus finanzas</Text>
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
              placeholder="Mínimo 6 caracteres"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            className="bg-emerald-500 p-5 rounded-2xl mt-8 flex-row justify-center items-center shadow-lg"
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-lg">Registrarse</Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="mt-10 flex-row justify-center">
          <Text className="text-gray-500">¿Ya tienes cuenta? </Text>
          <Link href="/auth/login" asChild>
            <TouchableOpacity>
              <Text className="text-emerald-600 font-bold">Inicia Sesión</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
