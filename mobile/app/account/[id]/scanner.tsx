import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, Camera } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import {
  useAudioRecorder,
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
  RecordingPresets,
} from "expo-audio";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sentry from "@sentry/react-native";
import { logger } from "@/src/utils/logger";
import { useProcessMedia } from "@/src/api/queries/transaction";
import {
  Camera as CameraIcon,
  Mic,
  X,
  Check,
  RefreshCw,
  Volume2,
  Image as ImageIcon,
} from "lucide-react-native";

export default function ScannerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState<
    "MENU" | "CAMERA" | "AUDIO_RECORDING" | "PREVIEW"
  >("MENU");
  const [hasCameraPermission, setHasCameraPermission] = useState<
    boolean | null
  >(null);
  const [hasAudioPermission, setHasAudioPermission] = useState<boolean | null>(
    null,
  );
  const processMediaMutation = useProcessMedia();

  // Camera State
  const cameraRef = useRef<any>(null);
  const [photo, setPhoto] = useState<string | null>(null);

  // Audio State
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [audioUri, setAudioUri] = useState<string | null>(null);

  const handleStartCamera = async () => {
    if (hasCameraPermission === null || !hasCameraPermission) {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === "granted");
      if (cameraStatus.status !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "Se requiere acceso a la cámara para tomar fotos.",
        );
        return;
      }
    }

    setMode("CAMERA");
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhoto(result.assets[0].uri);
        setMode("PREVIEW");
      }
    } catch (e) {
      logger.error("Gallery Error", { error: e });
      Sentry.captureException(e, { extra: { context: "pickImageFromGallery" } });
      Alert.alert("Error", "No se pudo seleccionar la imagen de la galería");
    }
  };

  const startRecording = async () => {
    if (hasAudioPermission === null || !hasAudioPermission) {
      const audioStatus = await requestRecordingPermissionsAsync();
      setHasAudioPermission(audioStatus.status === "granted");
      if (audioStatus.status !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "Se requiere acceso al micrófono para grabar audio.",
        );
        return;
      }
    }

    try {
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setMode("AUDIO_RECORDING");
    } catch (err) {
      logger.error("Failed to start recording", { error: err });
      Sentry.captureException(err, { extra: { context: "startRecording" } });
      Alert.alert("Error", "No se pudo iniciar la grabación.");
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          shutterSound: false,
        });
        setPhoto(photo.uri);
        setMode("PREVIEW");
      } catch (e) {
        logger.error("Camera Error", { error: e });
        Sentry.captureException(e, { extra: { context: "takePicture" } });
        Alert.alert("Error", "No se pudo tomar la foto");
      }
    }
  };

  const stopRecording = async () => {
    try {
      // Immediate UI feedback
      logger.info("Stopping recording...");
      await recorder.stop();

      const status = recorder.getStatus();
      const finalUri = recorder.uri || status.url;
      logger.info("Recording stopped", { finalUri });

      if (finalUri) {
        setAudioUri(finalUri);
        setMode("PREVIEW");
      } else {
        Alert.alert(
          "Error",
          "No se pudo obtener la ubicación del audio guardado.",
        );
        setMode("MENU");
      }
    } catch (err) {
      logger.error("Failed to stop recording", { error: err });
      Sentry.captureException(err, { extra: { context: "stopRecording" } });
      Alert.alert("Error", "No se pudo detener la grabación.");
      // Fallback to menu if it fails to stop properly
      setMode("MENU");
    }
  };

  const uploadMedia = async () => {
    const uri = photo || audioUri || recorder.uri;
    if (!uri) {
      Alert.alert("Error", "No hay archivo para subir.");
      return;
    }

    const formData = new FormData();
    formData.append("accountId", id as string);

    const fileType = photo ? "image/jpeg" : "audio/m4a";
    const fileName = photo ? "receipt.jpg" : "voice.m4a";

    // @ts-ignore
    formData.append("file", {
      uri,
      name: fileName,
      type: fileType,
    });

    processMediaMutation.mutate(formData, {
      onSuccess: () => {
        Alert.alert("¡Excelente!", "IA procesó tu gasto correctamente.", [
          {
            text: "Ir al historial",
            onPress: () => router.back(),
          },
        ]);
      },
      onError: (error: any) => {
        logger.error("Upload error", { error });
        Sentry.captureException(error, {
          extra: { context: "uploadMedia", accountId: id },
        });
        Alert.alert(
          "Error",
          "Hubo un problema al procesar con IA. Revisa tu conexión.",
        );
      },
    });
  };

  if (processMediaMutation.isPending) {
    return (
      <View className="flex-1 justify-center items-center bg-white p-10">
        <View className="bg-emerald-50 p-8 rounded-full mb-8">
          <ActivityIndicator size="large" color="#10B981" />
        </View>
        <Text className="text-2xl font-black text-gray-900 text-center">
          Analizando...
        </Text>
        <Text className="mt-2 text-gray-500 text-center text-base">
          Nuestra IA está leyendo tu recibo y categorizando los artículos en
          español.
        </Text>
      </View>
    );
  }

  if (mode === "CAMERA") {
    return (
      <View className="flex-1 bg-black">
        <CameraView ref={cameraRef} className="flex-1" facing="back" />

        {/* Top-left close button */}
        <SafeAreaView
          className="absolute top-6 left-6"
          pointerEvents="box-none"
        >
          <TouchableOpacity
            onPress={() => setMode("MENU")}
            className="bg-white/20 w-12 h-12 rounded-full items-center justify-center"
          >
            <X color="#fff" size={24} />
          </TouchableOpacity>
        </SafeAreaView>

        {/* Bottom controls */}
        <View
          className="absolute bottom-12 left-0 right-0 flex-row items-center justify-center px-12"
          pointerEvents="box-none"
        >
          {/* Gallery Button */}
          <TouchableOpacity
            onPress={pickImageFromGallery}
            className="absolute left-12 w-14 h-14 bg-gray-800 rounded-2xl justify-center items-center overflow-hidden border border-gray-600"
          >
            <ImageIcon color="#fff" size={24} />
          </TouchableOpacity>

          {/* Capture Button */}
          <TouchableOpacity
            onPress={takePicture}
            className="w-20 h-20 bg-white rounded-full border-4 border-emerald-500 justify-center items-center shadow-xl"
          >
            <View className="w-16 h-16 bg-white rounded-full border-2 border-emerald-600" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (mode === "AUDIO_RECORDING") {
    return (
      <View className="flex-1 bg-emerald-600 justify-center items-center p-6">
        <View className="bg-white/20 p-16 rounded-full mb-10 border border-white/30">
          <Mic color="#fff" size={80} />
        </View>
        <Text className="text-white text-3xl font-black mb-2">
          Escuchando...
        </Text>
        <Text className="text-emerald-100 text-lg text-center mb-20">
          &quot;Compré 3 cebollas por 1 dólar...&quot;
        </Text>

        <TouchableOpacity
          onPress={stopRecording}
          className="bg-white px-10 py-5 rounded-full shadow-2xl"
        >
          <Text className="text-emerald-600 font-black text-xl">DETENER</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (mode === "PREVIEW") {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 p-6">
        <Text className="text-2xl font-black text-gray-900 mt-4 mb-2">
          ¿Todo bien?
        </Text>
        <Text className="text-gray-500 mb-8">
          Confirma para que la IA extraiga los datos automáticamente.
        </Text>

        <View className="flex-1 justify-center items-center mb-10">
          {photo ? (
            <Image
              source={{ uri: photo }}
              className="w-full h-full rounded-3xl border-4 border-white shadow-lg"
              resizeMode="cover"
            />
          ) : (
            <View className="bg-emerald-50 w-full aspect-square rounded-3xl items-center justify-center border-2 border-emerald-100">
              <Volume2 color="#10B981" size={100} />
              <Text className="text-emerald-600 font-bold mt-4">
                Audio capturado
              </Text>
            </View>
          )}
        </View>

        <View className="flex-row gap-4 mb-6">
          <TouchableOpacity
            className="flex-1 bg-white border border-gray-200 p-5 rounded-2xl flex-row justify-center items-center shadow-sm"
            onPress={() => {
              setPhoto(null);
              setAudioUri(null);
              setMode("MENU");
            }}
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
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 p-6">
      <View className="flex-1 justify-center">
        <Text className="text-4xl font-black text-gray-900 mb-2">
          Nuevo Gasto
        </Text>
        <Text className="text-lg text-gray-400 mb-12">
          ¿Cómo quieres capturar los detalles?
        </Text>

        <TouchableOpacity
          activeOpacity={0.8}
          className="bg-white p-8 rounded-[40px] mb-6 flex-row items-center border border-gray-100 shadow-sm"
          onPress={handleStartCamera}
        >
          <View className="bg-emerald-100 p-5 rounded-3xl mr-6">
            <CameraIcon color="#10B981" size={32} />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-800">Cámara</Text>
            <Text className="text-gray-400 text-sm">
              Escanea un recibo físico
            </Text>
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
            <Text className="text-gray-400 text-sm">
              Dicta tu gasto rápidamente
            </Text>
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
