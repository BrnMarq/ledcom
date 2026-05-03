import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import client from '../src/api/client';
import { Wallet, ChevronRight, LogOut } from 'lucide-react-native';
import { useAuth } from '../src/context/AuthContext';

interface Account {
  id: number;
  name: string;
}

export default function AccountsScreen() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { signOut, user } = useAuth();

  const fetchAccounts = async () => {
    try {
      const response = await client.get('/api/accounts');
      setAccounts(response.data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAccounts();
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 p-4 pt-8">
      <Stack.Screen 
        options={{
          headerRight: () => (
            <TouchableOpacity onPress={signOut} className="mr-2">
              <LogOut color="#fff" size={20} />
            </TouchableOpacity>
          )
        }} 
      />
      <Text className="text-3xl font-bold text-gray-900 mb-2">Hola!</Text>
      <Text className="text-gray-500 mb-8 text-lg">{user?.email}</Text>
      
      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            className="bg-white p-5 rounded-3xl shadow-sm mb-4 flex-row items-center border border-gray-100"
            onPress={() => router.push(`/account/${item.id}`)}
          >
            <View className="bg-emerald-100 p-3 rounded-2xl mr-4">
              <Wallet color="#059669" size={24} />
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-800">{item.name}</Text>
              <Text className="text-gray-400 text-sm">Toca para ver actividad</Text>
            </View>
            <ChevronRight color="#D1D5DB" size={20} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="items-center mt-12 bg-white p-10 rounded-3xl border border-dashed border-gray-300">
            <Text className="text-gray-400 text-center text-lg">No tienes cuentas aún.</Text>
            <Text className="text-gray-400 text-center text-sm mt-1">Crea una desde la API para empezar.</Text>
          </View>
        }
      />
    </View>
  );
}
