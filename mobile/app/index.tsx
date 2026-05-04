import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, TextInput, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import client from '../src/api/client';
import { Wallet, ChevronRight, LogOut, Plus } from 'lucide-react-native';
import { useAuth } from '../src/context/AuthContext';

interface Account {
  id: number;
  name: string;
}

export default function AccountsScreen() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountSymbol, setNewAccountSymbol] = useState('USD');
  const [isCreating, setIsCreating] = useState(false);
  
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

  const handleCreateAccount = async () => {
    if (!newAccountName.trim()) {
      Alert.alert('Error', 'El nombre de la cuenta no puede estar vacío');
      return;
    }
    
    setIsCreating(true);
    try {
      await client.post('/api/accounts', { name: newAccountName.trim(), symbol: newAccountSymbol.trim() || 'USD' });
      setIsModalVisible(false);
      setNewAccountName('');
      setNewAccountSymbol('USD');
      fetchAccounts();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Error al crear la cuenta';
      Alert.alert('Error', message);
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAccounts();
    } else {
      setLoading(false); // Stop loading if not logged in to prevent infinite spinner
    }
  }, [user]);

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
            <Text className="text-gray-400 text-center text-sm mt-1">Toca el botón '+' abajo para empezar.</Text>
          </View>
        }
      />

      <TouchableOpacity
        activeOpacity={0.8}
        className="absolute bottom-8 right-6 bg-emerald-500 w-16 h-16 rounded-full justify-center items-center shadow-xl"
        onPress={() => setIsModalVisible(true)}
      >
        <Plus color="#fff" size={32} />
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setIsModalVisible(false);
          setNewAccountName('');
          setNewAccountSymbol('USD');
        }}
      >
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <View className="bg-white w-full rounded-3xl p-6 shadow-xl">
            <Text className="text-2xl font-bold text-gray-900 mb-4">Nueva Cuenta</Text>
            
            <Text className="text-gray-700 font-bold mb-2 ml-1">Nombre</Text>
            <TextInput
              className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-gray-800 mb-4"
              placeholder="Ej. Banesco, Binance..."
              value={newAccountName}
              onChangeText={setNewAccountName}
              autoFocus
            />

            <Text className="text-gray-700 font-bold mb-2 ml-1">Moneda (Símbolo)</Text>
            <TextInput
              className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-gray-800 mb-6"
              placeholder="Ej. USD, VES, EUR"
              value={newAccountSymbol}
              onChangeText={setNewAccountSymbol}
              autoCapitalize="characters"
            />

            <View className="flex-row justify-end space-x-3">
              <TouchableOpacity
                className="px-5 py-3 rounded-xl bg-gray-100"
                onPress={() => {
                  setIsModalVisible(false);
                  setNewAccountName('');
                  setNewAccountSymbol('USD');
                }}
                disabled={isCreating}
              >
                <Text className="text-gray-600 font-bold">Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className="px-5 py-3 rounded-xl bg-emerald-500 min-w-[100px] items-center"
                onPress={handleCreateAccount}
                disabled={isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text className="text-white font-bold">Crear</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
