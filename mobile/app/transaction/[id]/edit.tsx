import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import client from "../../../src/api/client";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react-native";
import { formatCurrency } from "../../../src/utils/currency";

interface TransactionItem {
  id?: number;
  name: string;
  quantity: string;
  unitPrice: number;
  totalPrice: string;
}

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [totalValue, setTotalValue] = useState("0");
  const [type, setType] = useState("WANTS");
  const [flow, setFlow] = useState("OUT");
  const [context, setContext] = useState("");
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [symbol, setSymbol] = useState("USD");

  useEffect(() => {
    fetchTransaction();
  }, [id]);

  const fetchTransaction = async () => {
    try {
      const response = await client.get(`/api/transactions/${id}`);
      const t = response.data;
      setTotalValue(t.totalValue.toString());
      setType(t.type);
      setFlow(t.flow);
      setContext(t.context || "");
      setItems(
        t.items
          ? t.items.map((item: any) => ({
              ...item,
              quantity: item.quantity.toString(),
              totalPrice: item.totalPrice.toString(),
            }))
          : [],
      );
      setSymbol(t.account?.symbol || "USD");
    } catch (error) {
      Alert.alert("Error", "No se pudo cargar la transacción.");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const computedTotal = items.length > 0 
    ? items.reduce((sum, item) => sum + (parseFloat(item.totalPrice) || 0), 0)
    : parseFloat(totalValue) || 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        totalValue: computedTotal,
        type,
        flow,
        context,
        items: items.map((item) => {
          const q = parseFloat(item.quantity) || 0;
          const t = parseFloat(item.totalPrice) || 0;
          return {
            ...item,
            quantity: q,
            totalPrice: t,
            unitPrice: q === 0 ? 0 : t / q,
          };
        }),
      };

      await client.patch(`/api/transactions/${id}`, payload);
      Alert.alert("Éxito", "Transacción actualizada", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo actualizar.");
    } finally {
      setSaving(false);
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      { name: "", quantity: "1", unitPrice: 0, totalPrice: "0" },
    ]);
  };

  const updateItem = (
    index: number,
    field: keyof TransactionItem,
    value: string,
  ) => {
    const newItems = [...items];
    if (field === "name") {
      newItems[index].name = value;
    } else {
      const rawValue = value.replace(/[^0-9.]/g, "");
      
      // Update string value directly to allow typing decimals like "1."
      newItems[index] = {
        ...newItems[index],
        [field]: rawValue,
      };

      // Auto-update unit price for display
      if (field === "quantity" || field === "totalPrice") {
        const q =
          field === "quantity"
            ? parseFloat(rawValue) || 0
            : parseFloat(newItems[index].quantity) || 0;
        const t =
          field === "totalPrice"
            ? parseFloat(rawValue) || 0
            : parseFloat(newItems[index].totalPrice) || 0;
        newItems[index].unitPrice = q === 0 ? 0 : t / q;
      }
    }
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center justify-between p-6 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft color="#374151" size={24} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800">Editar Gasto</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className="p-2 -mr-2"
        >
          {saving ? (
            <ActivityIndicator size="small" color="#10B981" />
          ) : (
            <Save color="#10B981" size={24} />
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 p-6"
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View className="mb-6">
            <Text className="text-gray-500 font-bold text-xs uppercase mb-2">
              Monto Total ({symbol})
            </Text>
            <View className="bg-gray-100 p-4 rounded-2xl border border-gray-200">
              <Text className="text-2xl font-black text-gray-500">
                {formatCurrency(computedTotal, symbol)}
              </Text>
            </View>
          </View>

          <View className="mb-6 flex-row gap-4">
            <View className="flex-1">
              <Text className="text-gray-500 font-bold text-xs uppercase mb-2">
                Flujo
              </Text>
              <View className="flex-row bg-gray-200 p-1 rounded-xl">
                <TouchableOpacity
                  className={`flex-1 py-2 items-center rounded-lg ${flow === "IN" ? "bg-white shadow-sm" : ""}`}
                  onPress={() => setFlow("IN")}
                >
                  <Text
                    className={`font-bold ${flow === "IN" ? "text-emerald-600" : "text-gray-500"}`}
                  >
                    IN
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 py-2 items-center rounded-lg ${flow === "OUT" ? "bg-white shadow-sm" : ""}`}
                  onPress={() => setFlow("OUT")}
                >
                  <Text
                    className={`font-bold ${flow === "OUT" ? "text-red-600" : "text-gray-500"}`}
                  >
                    OUT
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="flex-1">
              <Text className="text-gray-500 font-bold text-xs uppercase mb-2">
                Categoría
              </Text>
              <View className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <TouchableOpacity
                  className={`p-3 border-b border-gray-100 ${type === "NEEDS" ? "bg-emerald-50" : ""}`}
                  onPress={() => setType("NEEDS")}
                >
                  <Text
                    className={`text-center font-bold ${type === "NEEDS" ? "text-emerald-700" : "text-gray-600"}`}
                  >
                    NEEDS
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`p-3 border-b border-gray-100 ${type === "WANTS" ? "bg-emerald-50" : ""}`}
                  onPress={() => setType("WANTS")}
                >
                  <Text
                    className={`text-center font-bold ${type === "WANTS" ? "text-emerald-700" : "text-gray-600"}`}
                  >
                    WANTS
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`p-3 ${type === "SAVINGS" ? "bg-emerald-50" : ""}`}
                  onPress={() => setType("SAVINGS")}
                >
                  <Text
                    className={`text-center font-bold ${type === "SAVINGS" ? "text-emerald-700" : "text-gray-600"}`}
                  >
                    SAVINGS
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-gray-500 font-bold text-xs uppercase mb-2">
              Contexto / Resumen
            </Text>
            <TextInput
              value={context}
              onChangeText={setContext}
              multiline
              numberOfLines={3}
              className="bg-white p-4 rounded-2xl text-base text-gray-800 border border-gray-200 min-h-[100px]"
              style={{ textAlignVertical: "top" }}
            />
          </View>

          <View className="mb-2 flex-row justify-between items-center">
            <Text className="text-gray-500 font-bold text-xs uppercase">
              Artículos ({items.length})
            </Text>
            <TouchableOpacity
              onPress={addItem}
              className="bg-emerald-100 p-2 rounded-full"
            >
              <Plus color="#059669" size={16} />
            </TouchableOpacity>
          </View>

          {items.map((item, index) => (
            <View
              key={item.id ? `item-${item.id}` : `new-${index}`}
              className="bg-white p-4 rounded-2xl border border-gray-200 mb-4"
            >
              <View className="flex-row justify-between items-center mb-2">
                <TextInput
                  value={item.name}
                  onChangeText={(val) => updateItem(index, "name", val)}
                  placeholder="Nombre del artículo"
                  className="flex-1 text-base font-bold text-gray-800 border-b border-gray-100 pb-1 mr-2"
                />
                <TouchableOpacity onPress={() => removeItem(index)}>
                  <Trash2 color="#EF4444" size={20} />
                </TouchableOpacity>
              </View>
              <View className="flex-row gap-2 mt-2">
                <View className="flex-1">
                  <Text className="text-xs text-gray-400 mb-1">Cant.</Text>
                  <TextInput
                    value={item.quantity}
                    onChangeText={(val) => updateItem(index, "quantity", val)}
                    keyboardType="decimal-pad"
                    className="bg-gray-50 p-2 rounded-lg text-sm"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-400 mb-1">Total</Text>
                  <TextInput
                    value={item.totalPrice}
                    onChangeText={(val) => updateItem(index, "totalPrice", val)}
                    keyboardType="decimal-pad"
                    className="bg-gray-50 p-2 rounded-lg text-sm font-bold"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-400 mb-1">Precio U.</Text>
                  <Text className="p-2 text-sm text-gray-500">
                    {formatCurrency(item.unitPrice || 0, symbol)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

