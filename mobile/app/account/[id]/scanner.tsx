import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import client from '../../../src/api/client';
import { Camera as CameraIcon, Mic, X, Check, RefreshCw, Volume2 } from 'lucide-react-native';

export default function ScannerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState<'MENU' | 'CAMERA' | 'AUDIO_RECORDING' | 'PREVIEW'>('MENU');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [hasAudioPermission, setHasAudioPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Camera State
  const cameraRef = useRef<any>(null);
  const [photo, setPhoto] = useState<string | null>(null);

  // Audio State
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');

      const audioStatus = await Audio.requestPermissionsAsync();
      setHasAudioPermission(audioStatus.status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
        setPhoto(photo.uri);
        setMode('PREVIEW');
      } catch (e) {
        console.error("Camera Error:", e);
        Alert.alert("Error", "No se pudo tomar la foto");
      }
    }
  };

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setMode('AUDIO_RECORDING');
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      setRecording(null);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      setMode('PREVIEW');
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const uploadMedia = async () => {
    const uri = photo || audioUri;
    if (!uri) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('accountId', id as string);
    formData.append('symbol', 'USD');
    
    const fileType = photo ? 'image/jpeg' : 'audio/m4a';
    const fileName = photo ? 'receipt.jpg' : 'voice.m4a';

    // @ts-ignore
    formData.append('file', {
      uri,
      name: fileName,
      type: fileType,
    });

    try {
      await client.post('/api/transactions/from-media', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      Alert.alert('¡Excelente!', 'IA procesó tu gasto correctamente.', [
        { text: 'Ir al historial', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Hubo un problema al procesar con IA. Revisa tu conexión.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (hasCameraPermission === null || hasAudioPermission === null) {
    return <View className="flex-1 justify-center items-center"><ActivityIndicator /></View>;
  }

  if (isProcessing) {
    return (
      <View className="flex-1 justify-center items-center bg-white p-10">
        <View className="bg-emerald-50 p-8 rounded-full mb-8">
            <ActivityIndicator size="large" color="#10B981" />
        </View>
        <Text className="text-2xl font-black text-gray-900 text-center">Analizando...</Text>
        <Text className="mt-2 text-gray-500 text-center text-base">Nuestra IA está leyendo tu recibo y categorizando los artículos en español.</Text>
      </View>
    );
  }

  if (mode === 'CAMERA') {
    return (
      <View className="flex-1 bg-black">
        <CameraView ref={cameraRef} className="flex-1" facing="back">
          <SafeAreaView className="flex-1 justify-between p-6">
            <TouchableOpacity onPress={() => setMode('MENU')} className="bg-white/20 w-12 h-12 rounded-full items-center justify-center">
                <X color="#fff" size={24} />
            </TouchableOpacity>
            <View className="items-center pb-10">
              <TouchableOpacity 
                onPress={takePicture}
                className="w-20 h-20 bg-white rounded-full border-4 border-emerald-500 justify-center items-center shadow-xl"
              >
                <View className="w-16 h-16 bg-white rounded-full border-2 border-emerald-600" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </CameraView>
      </View>
    );
  }

  if (mode === 'AUDIO_RECORDING') {
    return (
        <View className="flex-1 bg-emerald-600 justify-center items-center p-6">
            <View className="bg-white/20 p-16 rounded-full mb-10 border border-white/30">
                <Mic color="#fff" size={80} />
            </View>
            <Text className="text-white text-3xl font-black mb-2">Escuchando...</Text>
            <Text className="text-emerald-100 text-lg text-center mb-20">"Compré 3 cebollas por 1 dólar..."</Text>
            
            <TouchableOpacity 
                onPress={stopRecording}
                className="bg-white px-10 py-5 rounded-full shadow-2xl"
            >
                <Text className="text-emerald-600 font-black text-xl">DETENER</Text>
            </TouchableOpacity>
        </View>
    )
  }

  if (mode === 'PREVIEW') {
    return (
        <SafeAreaView className="flex-1 bg-gray-50 p-6">
            <Text className="text-2xl font-black text-gray-900 mt-4 mb-2">¿Todo bien?</Text>
            <Text className="text-gray-500 mb-8">Confirma para que la IA extraiga los datos automáticamente.</Text>
            
            <View className="flex-1 justify-center items-center mb-10">
                {photo ? (
                    <Image source={{ uri: photo }} className="w-full h-full rounded-3xl border-4 border-white shadow-lg" resizeMode="cover" />
                ) : (
                    <View className="bg-emerald-50 w-full aspect-square rounded-3xl items-center justify-center border-2 border-emerald-100">
                        <Volume2 color="#10B981" size={100} />
                        <Text className="text-emerald-600 font-bold mt-4">Audio capturado</Text>
                    </View>
                )}
            </View>

            <View className="flex-row gap-4 mb-6">
                <TouchableOpacity 
                    className="flex-1 bg-white border border-gray-200 p-5 rounded-2xl flex-row justify-center items-center shadow-sm"
                    onPress={() => { setPhoto(null); setAudioUri(null); setMode('MENU'); }}
                >
                    <RefreshCw color="#6B7280" size={20} className="mr-2" />
                    <Text className="font-bold text-gray-500 ml-2">Reintentar</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    className="flex-1 bg-emerald-500 p-5 rounded-2xl flex-row justify-center items-center shadow-lg"
                    onPress={uploadMedia}
                >
                    <Check color="#fff" size={20} className="mr-2" />
                    <Text className="font-bold text-white ml-2">Confirmar</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 p-6">
      <View className="flex-1 justify-center">
        <Text className="text-4xl font-black text-gray-900 mb-2">Nuevo Gasto</Text>
        <Text className="text-lg text-gray-400 mb-12">¿Cómo quieres capturar los detalles?</Text>
        
        <TouchableOpacity 
            activeOpacity={0.8}
            className="bg-white p-8 rounded-[40px] mb-6 flex-row items-center border border-gray-100 shadow-sm"
            onPress={() => setMode('CAMERA')}
        >
            <View className="bg-emerald-100 p-5 rounded-3xl mr-6">
                <CameraIcon color="#10B981" size={32} />
            </View>
            <View className="flex-1">
                <Text className="text-2xl font-bold text-gray-800">Cámara</Text>
                <Text className="text-gray-400 text-sm">Escanea un recibo físico</Text>
            </View>
        </TouchableOpacity>

        <TouchableOpacity 
            activeOpacity={0.8}
            className="bg-white p-8 rounded-[40px] flex-row items-center border border-gray-100 shadow-sm"
            onPress={startRecording}
        >
            <View className="bg-emerald-500 p-5 rounded-3xl mr-6 shadow-emerald-200 shadow-lg">
                <Mic color="#fff" size={32} />
            </View>
            <View className="flex-1">
                <Text className="text-2xl font-bold text-gray-800">Voz</Text>
                <Text className="text-gray-400 text-sm">Dicta tu gasto rápidamente</Text>
            </View>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        onPress={() => router.back()}
        className="mt-10 items-center"
      >
        <Text className="text-gray-400 font-bold">Cancelar</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
