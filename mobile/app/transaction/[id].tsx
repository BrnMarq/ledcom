import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import client from '../../src/api/client';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Calendar, Tag, Info, Receipt, Edit2 } from 'lucide-react-native';
import { formatCurrency } from '../../src/utils/currency';

interface TransactionItem {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Account {
  id: number;
  symbol: string;
}

interface Transaction {
  id: number;
  totalValue: number;
  type: string;
  flow: 'IN' | 'OUT';
  date: string;
  context: string;
  status: string;
  items: TransactionItem[];
  account: Account;
  accountId: number;
}

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      fetchTransaction();
    }, [id])
  );

  const fetchTransaction = async () => {
    try {
      const response = await client.get(`/api/transactions/${id}`);
      setTransaction(response.data);
    } catch (error) {
      console.error('Error fetching transaction detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (transaction?.accountId) {
      router.replace({
        pathname: "/account/[id]",
        params: { id: transaction.accountId, refresh: "true" }
      });
    } else {
      router.back();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (!transaction) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-6">
        <Text className="text-gray-500 text-lg">No se encontró la transacción.</Text>
        <TouchableOpacity 
          className="mt-4 bg-emerald-500 px-6 py-3 rounded-xl"
          onPress={handleBack}
        >
          <Text className="text-white font-bold">Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header Summary */}
      <View className={`p-8 pb-12 items-center relative ${transaction.flow === 'IN' ? 'bg-emerald-500' : 'bg-red-500'}`}>
        <TouchableOpacity 
          className="absolute top-12 left-6 bg-white/20 p-2 rounded-full" 
          onPress={handleBack}
        >
          <ArrowLeft color="#fff" size={20} />
        </TouchableOpacity>
        <TouchableOpacity 
          className="absolute top-12 right-6 bg-white/20 p-2 rounded-full" 
          onPress={() => router.push(`/transaction/${id}/edit`)}
        >
          <Edit2 color="#fff" size={20} />
        </TouchableOpacity>
        <Text className="text-white/80 font-bold uppercase tracking-widest text-xs mb-2 mt-4">Monto Total</Text>
        <Text className="text-white text-5xl font-black">
          {transaction.flow === 'IN' ? '+' : '-'}{formatCurrency(transaction.totalValue, transaction.account?.symbol)}
        </Text>
        <View className="bg-white/20 px-3 py-1 rounded-full mt-4">
            <Text className="text-white font-bold text-xs">{transaction.account?.symbol || 'USD'}</Text>
        </View>
      </View>

      <View className="px-4 -mt-6">
        {/* Main Info Card */}
        <View className="bg-white rounded-3xl p-6 shadow-sm mb-6">
            <View className="flex-row items-center mb-6">
                <View className={`p-3 rounded-2xl mr-4 ${transaction.flow === 'IN' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                    {transaction.flow === 'IN' ? (
                        <ArrowDownLeft color="#059669" size={24} />
                    ) : (
                        <ArrowUpRight color="#DC2626" size={24} />
                    )}
                </View>
                <View className="flex-1">
                    <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-tighter">Tipo de Flujo</Text>
                    <Text className="text-gray-800 font-bold text-lg">
                        {transaction.flow === 'IN' ? 'Ingreso / Reembolso' : 'Gasto / Salida'}
                    </Text>
                </View>
            </View>

            <View className="space-y-4">
                <View className="flex-row items-center">
                    <Calendar color="#9CA3AF" size={18} />
                    <Text className="text-gray-600 ml-3 text-sm flex-1 capitalize">{formatDate(transaction.date)}</Text>
                </View>
                
                <View className="flex-row items-center mt-4">
                    <Tag color="#9CA3AF" size={18} />
                    <Text className="text-gray-600 ml-3 text-sm">Categoría: <Text className="font-bold text-emerald-600">{transaction.type}</Text></Text>
                </View>
            </View>
        </View>

        {/* AI Context Card */}
        <View className="bg-white rounded-3xl p-6 shadow-sm mb-6">
            <Text className="text-gray-400 text-[10px] font-bold uppercase mb-3 tracking-widest">Resumen IA</Text>
            <Text className="text-gray-800 leading-6 italic">"{transaction.context || 'Sin descripción disponible.'}"</Text>
        </View>

        {/* Items Card */}
        {transaction.items && transaction.items.length > 0 && (
            <View className="bg-white rounded-3xl p-6 shadow-sm mb-10">
                <View className="flex-row items-center mb-4">
                    <Receipt color="#10B981" size={20} />
                    <Text className="text-gray-800 font-black text-lg ml-2">Artículos</Text>
                </View>
                
                {transaction.items.map((item, index) => (
                    <View key={item.id} className={`py-4 flex-row justify-between items-center ${index !== transaction.items.length - 1 ? 'border-b border-gray-50' : ''}`}>
                        <View className="flex-1">
                            <Text className="text-gray-800 font-bold">{item.name}</Text>
                            <Text className="text-gray-400 text-xs">{item.quantity} x {formatCurrency(item.unitPrice, transaction.account?.symbol)}</Text>
                        </View>
                        <Text className="text-gray-900 font-black">{formatCurrency(item.totalPrice, transaction.account?.symbol)}</Text>
                    </View>
                ))}
            </View>
        )}
      </View>
    </ScrollView>
  );
}
