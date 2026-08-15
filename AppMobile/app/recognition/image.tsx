import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Camera, CheckCircle, Wallet as WalletIcon, ScanLine } from 'lucide-react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  withSequence,
  withSpring,
  FadeIn,
  FadeInDown,
  interpolate,
  Extrapolation
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePoints } from '../../contexts/PointsContext';
import { PageHeader } from '../../components/PageHeader';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';
import { io } from 'socket.io-client';
import Constants from 'expo-constants';

const hostIp = Constants.expoConfig?.hostUri?.split(':')[0] || '10.0.2.2';
const socket = io(`http://${hostIp}:3001`);

const modelJson = require('../../assets/models/model.json');
const modelWeights = require('../../assets/models/weights.bin');
const metadataJson = require('../../assets/models/metadata.json');

const { width, height } = Dimensions.get('window');

export default function ImageRecognitionScreen() {
  const insets = useSafeAreaInsets();
  const { addPoints } = usePoints();
  const [permission, requestPermission] = useCameraPermissions();
  
  const [status, setStatus] = useState<'scanning' | 'success'>('scanning');
  const [pointsEarned, setPointsEarned] = useState(0);

  // TensorFlow states
  const [isTfReady, setIsTfReady] = useState(false);
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [prediction, setPrediction] = useState<string>('Buscando emissora...');

  // Animation values
  const scannerLineY = useSharedValue(0);
  const successScale = useSharedValue(0.5);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    // Inicializar TensorFlow com Modelo Customizado (Teachable Machine)
    const initTensorFlow = async () => {
      try {
        await tf.ready();
        setIsTfReady(true);
        const customModel = await tf.loadLayersModel(bundleResourceIO(modelJson, modelWeights));
        setModel(customModel);
      } catch (err) {
        console.error("TF Init Error:", err);
      }
    };
    initTensorFlow();
  }, []);
  
  useEffect(() => {
    // Scanner line animation
    scannerLineY.value = withRepeat(
      withSequence(
        withTiming(200, { duration: 1500 }),
        withTiming(0, { duration: 1500 })
      ),
      -1, // Infinite
      true
    );

    // Run recognition logic if permissions granted and model loaded
    // Run recognition logic if permissions granted and model loaded
    if (permission?.granted && model && status === 'scanning') {
      const recognitionInterval = setInterval(async () => {
        try {
          if (!cameraRef.current) return;
          
          const photo = await cameraRef.current.takePictureAsync({ quality: 0.1, base64: true, skipProcessing: true });
          if (!photo || !photo.base64) return;

          setPrediction("Decodificando imagem...");
          // Decodificação super rápida e imune a falhas de fetch usando o Buffer
          const { Buffer } = require('buffer');
          const bytes = new Uint8Array(Buffer.from(photo.base64, 'base64'));
          
          setPrediction("Processando no TensorFlow...");
          const { decodeJpeg } = require('@tensorflow/tfjs-react-native');
          const rawImageTensor = decodeJpeg(bytes);
          
          setPrediction("Classificando...");
          // Recortar o centro da imagem para ficar quadrada (1:1) antes de encolher!
          // Se não recortar, a imagem fica esmagada e a IA não reconhece nada.
          const [height, width] = rawImageTensor.shape;
          const size = Math.min(height, width);
          const startY = Math.floor((height - size) / 2);
          const startX = Math.floor((width - size) / 2);
          const cropped = tf.slice(rawImageTensor as tf.Tensor3D, [startY, startX, 0], [size, size, 3]);

          // Pre-processamento Teachable Machine Grayscale 96x96
          const resized = tf.image.resizeBilinear(cropped, [96, 96]);
          const grayscale = tf.mean(resized, 2, true);
          
          // Normalização padrão (0 a 1 em vez de -1 a 1 para alguns modelos TM)
          const normalized = grayscale.div(tf.scalar(255.0));
          const batched = normalized.expandDims(0);
          
          const predictionsTensor = await model.predict(batched) as tf.Tensor;
          const predictionsArray = await predictionsTensor.data();
          
          rawImageTensor.dispose();
          cropped.dispose();
          resized.dispose();
          grayscale.dispose();
          normalized.dispose();
          batched.dispose();
          predictionsTensor.dispose();

          let bestProb = 0;
          let bestIndex = 0;
          for (let i = 0; i < predictionsArray.length; i++) {
            if (predictionsArray[i] > bestProb) {
              bestProb = predictionsArray[i];
              bestIndex = i;
            }
          }

          if (bestProb > 0) {
            const bestClassName = metadataJson.labels[bestIndex];
            setPrediction(`Vendo: ${bestClassName} (${Math.round(bestProb * 100)}%)`);
            
            // Reduzi pra 60% de confiança pra ficar mais fácil nessa fase de testes
            if (bestProb > 0.6) {
              clearInterval(recognitionInterval);
              setStatus('success');
              setPointsEarned(30);
              addPoints(30, `Reconhecimento TF: ${bestClassName}`);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              successScale.value = withSpring(1, { damping: 12 });
            }
          } else {
            setPrediction("Nada reconhecido");
          }
        } catch (error: any) {
          console.log('Erro TF:', error);
          setPrediction(`Erro: ${error.message || "desconhecido"}`);
        }
      }, 3000); // 3 segundos para evitar muito pisca-pisca da camera

      return () => clearInterval(recognitionInterval);
    }
  }, [permission, model, status]);

  const scannerLineStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: scannerLineY.value }],
    };
  }, []);

  const handleSendReaction = (emoji: string) => {
    socket.emit('send_reaction', emoji);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (status !== 'scanning') return;
    
    setStatus('success');
    setPointsEarned(30);
    addPoints(30, 'Reconhecimento de TV Manual');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    successScale.value = withSpring(1, { damping: 12 });
  };

  const successIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: successScale.value }]
    };
  });

  if (!permission) {
    return <View className="flex-1 bg-[#0a0a0a]" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-[#0a0a0a] items-center justify-center px-6">
        <Camera size={64} color="#ffcc00" className="mb-6" />
        <Text className="text-xl font-bold text-white text-center mb-4">Precisamos da sua permissão para usar a câmera</Text>
        <Text className="text-base text-white/50 text-center mb-8">A câmera é necessária para reconhecer a programação da TV e te dar pontos!</Text>
        <TouchableOpacity 
          onPress={requestPermission}
          className="bg-[#ffcc00] px-8 py-4 rounded-2xl w-full items-center"
        >
          <Text className="text-[#1a1a1a] font-bold text-lg">Conceder Permissão</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => router.back()}
          className="mt-6"
        >
          <Text className="text-white/50 font-bold">Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0a0a0a]">
      {status === 'scanning' ? (
        <View style={StyleSheet.absoluteFill}>
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
          
          {/* Overlay Escuro com Recorte */}
          <View style={StyleSheet.absoluteFill}>
            {/* Top Overlay */}
            <View className="w-full bg-black/60" style={{ height: (height - 250) / 2 }} />
            
            <View className="flex-row w-full h-[250px]">
              {/* Left Overlay */}
              <View className="flex-1 bg-black/60" />
              
              {/* O "Buraco" transparente / Mira */}
              <View className="w-[250px] h-[250px] relative border-2 border-[#ffcc00]/50 rounded-xl overflow-hidden">
                {/* Cantos da Mira */}
                <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#ffcc00] rounded-tl-xl" />
                <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#ffcc00] rounded-tr-xl" />
                <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#ffcc00] rounded-bl-xl" />
                <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#ffcc00] rounded-br-xl" />

                {/* Linha do Scanner Animada */}
                <Animated.View style={[scannerLineStyle, { shadowColor: '#ffcc00', shadowOpacity: 1, shadowRadius: 10, elevation: 10 }]} className="w-full h-1 bg-[#ffcc00] shadow-xl" />
                
                <View className="absolute bottom-4 left-0 right-0 items-center opacity-70">
                  <ScanLine size={32} color="#ffcc00" />
                </View>
              </View>

              {/* Right Overlay */}
              <View className="flex-1 bg-black/60" />
            </View>

            {/* Bottom Overlay */}
            <View className="flex-1 w-full bg-black/60 items-center">
              <Text className="text-white text-xl font-bold mt-12 text-center px-8">
                Aponte a câmera para a TV
              </Text>
              <Text className="text-white/50 text-base mt-2 text-center px-8 mb-4">
                Mantenha a imagem nítida dentro do quadro para o reconhecimento.
              </Text>
              
              <View className="bg-black/80 px-4 py-2 rounded-full border border-[#ffcc00]/30">
                <Text className="text-[#ffcc00] font-bold text-sm">
                  {isTfReady ? prediction : "Iniciando TensorFlow..."}
                </Text>
              </View>
            </View>
          </View>

          {/* Header Controls */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50 }}>
            <PageHeader title="Reconhecimento" showBack isDark />
          </View>
        </View>
      ) : (
        <View className="flex-1 items-center justify-center bg-[#0a0a0a] px-6">
          <Animated.View entering={FadeIn.duration(500)} className="items-center justify-center w-full">
            <Animated.View style={successIconStyle} className="w-32 h-32 rounded-full bg-green-500/20 items-center justify-center mb-8 border-4 border-green-500/30">
              <CheckCircle size={64} color="#22c55e" />
            </Animated.View>
            
            <Text className="text-3xl font-extrabold text-white text-center mb-2">
              Imagem Reconhecida!
            </Text>
            <Text className="text-lg text-white/70 text-center mb-8">
              Você está assistindo <Text className="text-[#ffcc00] font-bold">TV Globo</Text>
            </Text>

            <View className="bg-[#1a1a1a] rounded-3xl p-6 w-full border border-white/10 items-center mb-8">
              <Text className="text-white/60 text-sm font-bold uppercase tracking-widest mb-2">Recompensa</Text>
              <View className="flex-row items-center justify-center">
                <Text className="text-5xl font-black text-[#ffcc00]">+{pointsEarned}</Text>
                <Text className="text-xl font-bold text-[#ffcc00] ml-2 mt-4">pts</Text>
              </View>
            </View>

            <TouchableOpacity 
              onPress={() => router.replace('/(tabs)/wallet')}
              className="w-full bg-[#ffcc00] rounded-2xl p-4 flex-row items-center justify-center shadow-lg"
              style={{ shadowColor: '#ffcc00', shadowOpacity: 0.3, shadowRadius: 10 }}
            >
              <WalletIcon size={20} color="#1a1a1a" />
              <Text className="text-[#1a1a1a] font-black text-lg ml-2">Ver na Carteira</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => router.back()}
              className="mt-6"
            >
              <Text className="text-white/50 font-bold text-base">Voltar ao Início</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      {/* Floating Reaction Bar (Fixed visibility) */}
      <Animated.View 
        entering={FadeInDown.delay(600).springify()}
        className="absolute bottom-12 self-center bg-black/90 px-8 py-4 rounded-full border border-white/20 flex-row gap-8 shadow-2xl"
        style={{ zIndex: 9999, elevation: 20 }}
      >
        <Text className="absolute -top-7 w-full text-center text-white/70 text-xs font-bold uppercase tracking-widest shadow-black">Reagir na TV</Text>
        {['🔥', '👏', '😱', '❤️'].map((emoji) => (
          <TouchableOpacity 
            key={emoji}
            onPress={() => handleSendReaction(emoji)}
            className="w-14 h-14 bg-white/10 rounded-full items-center justify-center active:bg-white/30 transition-all active:scale-90 border border-white/10 shadow-lg"
          >
            <Text className="text-3xl">{emoji}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

    </View>
  );
}
