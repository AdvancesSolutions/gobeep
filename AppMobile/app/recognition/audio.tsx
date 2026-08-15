import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ChevronLeft, Mic, CheckCircle, Wallet as WalletIcon, AlertCircle } from 'lucide-react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  withSpring,
  FadeIn,
  FadeInDown,
  FadeOutUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePoints } from '../../contexts/PointsContext';
import { useGamification } from '../../contexts/GamificationContext';
import { PageHeader } from '../../components/PageHeader';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { io } from 'socket.io-client';
import Constants from 'expo-constants';

// Get the actual local IP address from Expo's dev server to ensure physical devices can connect
const debuggerHost = Constants.expoConfig?.hostUri;
const hostIp = debuggerHost?.split(':')[0] || '10.0.2.2';
const socketUrl = 'http://' + hostIp + ':3001';

const socket = io(socketUrl);

// ==========================================
// AUDD.IO - Reconhecimento de Áudio
// Token Oficial do Usuário
// ==========================================
const AUDD_API_TOKEN = 'd1919fa06ee9fb09354719681b58e4bc'; 
// ==========================================

const { width } = Dimensions.get('window');

export default function AudioRecognitionScreen() {
  const insets = useSafeAreaInsets();
  const { addPoints } = usePoints();
  const { evaluateAction, newUnlockedAchievement, clearNewAchievement } = useGamification();

  const [status, setStatus] = useState<'requesting' | 'listening' | 'analyzing' | 'success' | 'error'>('requesting');
  const [pointsEarned, setPointsEarned] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [recognizedTitle, setRecognizedTitle] = useState('');

  // Multiplier State
  const [isMultiplierActive, setIsMultiplierActive] = useState(false);
  const [multiplierTimeLeft, setMultiplierTimeLeft] = useState(0);

  // Setup Socket.io connection for multiplier
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Mobile App connected to Real-Time Server');
    });

    socket.on('multiplier_active', (data) => {
      console.log('🔥 Multiplier activated for', data.duration, 'seconds');
      setIsMultiplierActive(true);
      setMultiplierTimeLeft(data.duration || 180);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    });

    return () => {
      socket.off('connect');
      socket.off('multiplier_active');
    };
  }, []);

  // Multiplier Timer
  useEffect(() => {
    let timer: any;
    if (multiplierTimeLeft > 0) {
      timer = setInterval(() => {
        setMultiplierTimeLeft((prev) => {
          if (prev <= 1) {
            setIsMultiplierActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setIsMultiplierActive(false);
    }
    return () => clearInterval(timer);
  }, [multiplierTimeLeft]);
  
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Animation values
  const volumeScale = useSharedValue(1);
  const successScale = useSharedValue(0.5);
  
  useEffect(() => {
    let isMounted = true;
    
    async function startFlow() {
      try {
        console.log('Requesting permissions...');
        const permission = await Audio.requestPermissionsAsync();
        
        if (permission.status !== 'granted') {
          if (isMounted) {
            setErrorMessage('Permissão de microfone negada. Precisamos ouvir o ambiente para identificar o áudio.');
            setStatus('error');
          }
          return;
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        console.log('Starting recording...');
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY,
          (status) => {
            if (status.isRecording && status.metering !== undefined) {
              const normalizedVolume = Math.max(0, status.metering + 60) / 60; 
              const targetScale = 1 + (normalizedVolume * 1.5);
              volumeScale.value = withTiming(targetScale, { duration: 100 });
            }
          },
          100 
        );

        recordingRef.current = recording;
        if (isMounted) setStatus('listening');

        // Escuta por 5 segundos para ter uma boa amostra
        await new Promise(resolve => setTimeout(resolve, 5000));

        if (!isMounted) return;
        
        // Para a gravação
        setStatus('analyzing');
        volumeScale.value = withTiming(1);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        console.log('Stopping recording...');
        await recording.stopAndUnloadAsync();
        recordingRef.current = null;
        const uri = recording.getURI();
        
        if (!uri) throw new Error("Não foi possível salvar a gravação.");

        // =========================================
        // ENVIO PARA O AUDD.IO
        // =========================================
        
        const formData = new FormData();
        formData.append('file', { uri, type: 'audio/m4a', name: 'sample.m4a' } as any);
        formData.append('api_token', AUDD_API_TOKEN);

        const res = await fetch(`https://api.audd.io/`, {
          method: 'POST',
          body: formData,
          headers: {
             'Accept': 'application/json',
          }
        });
        
        const result = await res.json();
        console.log("AudD Response: ", JSON.stringify(result));

        if (!isMounted) return;

        if (result.status === "success" && result.result) {
           // Sucesso no reconhecimento!
           const title = `${result.result.title} - ${result.result.artist}`;
           
           setRecognizedTitle(title);
           setStatus('success');
           
           const pointsToAward = isMultiplierActive ? 75 : 25;
           setPointsEarned(pointsToAward);
           addPoints(pointsToAward, `Reconhecimento: ${title}`);
           
           // Gamification hook
           evaluateAction('audio_recognized', { title, isMultiplierActive });
           
           // EMIT TO REAL-TIME SERVER
           // Mock de dados ricos para visualização do SaaS
           const mockUserData = {
             name: 'Alessandro',
             age: 32,
             gender: 'Masculino',
             avatar: 'https://i.pravatar.cc/150?u=alessandro',
             interests: ['Música', 'Tecnologia', 'Notícias']
           };

           socket.emit('audio_recognized', { 
             city: 'Brasília, DF', 
             coords: [-15.7938, -47.8827],
             title,
             user: mockUserData
           });

           Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

           // Simulação In-App do Retargeting / Pesquisa Eleitoral
           setTimeout(() => {
             Alert.alert(
               "🎙️ Termômetro do Debate",
               `Como você avalia a resposta do candidato no áudio "${title}"?`,
               [
                 { text: "Péssima", onPress: () => console.log("Votou Péssima"), style: "destructive" },
                 { text: "Excelente", onPress: () => {
                   console.log("Votou Excelente");
                   addPoints(100, "Voto Computado!");
                 }},
               ]
             );
           }, 5000);
           
           successScale.value = withSpring(1, { damping: 12 });
        } else if (result.status === "success" && !result.result) {
           // Não encontrou a música
           setErrorMessage("Não consegui identificar nenhuma música neste áudio.");
           setStatus('error');
        } else {
           // Falha da API
           setErrorMessage(result.error?.error_message || "Falha na nuvem de reconhecimento.");
           setStatus('error');
        }

      } catch (err: any) {
        console.error('AudD Error', err);
        if (isMounted) {
          setErrorMessage(err.message || 'Erro ao processar o áudio com a nuvem');
          setStatus('error');
        }
      }
    }

    startFlow();

    return () => {
      isMounted = false;
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  const handleSendReaction = (emoji: string) => {
    socket.emit('send_reaction', emoji);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  const pulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: volumeScale.value }],
      opacity: 0.6 - (volumeScale.value - 1) * 0.3, // Fica mais transparente quando expande
    };
  });

  const successIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: successScale.value }]
    };
  });

  return (
    <View className="flex-1 bg-[#0a0a0a]">
      {/* Header Controls */}
      <PageHeader title="Reconhecimento" showBack isDark />

      {/* Sponsored Multiplier Banner */}
      {isMultiplierActive && (
        <Animated.View 
          entering={FadeInDown} 
          exiting={FadeOutUp}
          className="mx-6 mt-4 bg-red-600 rounded-2xl p-4 shadow-lg border border-red-400 flex-row items-center z-50"
        >
          <MaterialCommunityIcons name="fire" size={28} color="yellow" />
          <View className="ml-3 flex-1">
            <Text className="text-white font-black text-sm uppercase">Intervalo Patrocinado</Text>
            <Text className="text-red-100 font-medium text-xs">Bipe agora e ganhe 3X Pontos! ({Math.floor(multiplierTimeLeft/60)}:{(multiplierTimeLeft%60).toString().padStart(2, '0')})</Text>
          </View>
        </Animated.View>
      )}

      <View className="flex-1 items-center justify-center -mt-20">
        {status === 'error' ? (
          <Animated.View entering={FadeIn.duration(500)} className="items-center px-8">
            <View className="w-24 h-24 rounded-full bg-red-500/20 items-center justify-center mb-6">
              <AlertCircle size={48} color="#ef4444" />
            </View>
            <Text className="text-xl font-bold text-white text-center mb-4">Ops!</Text>
            <Text className="text-white/60 text-center mb-8">{errorMessage}</Text>
            <TouchableOpacity 
              onPress={() => router.back()}
              className="bg-white/10 px-8 py-4 rounded-xl"
            >
              <Text className="text-white font-bold">Voltar</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : status !== 'success' ? (
          <>
            <View className="items-center justify-center w-64 h-64 relative">
              <Animated.View 
                className="absolute w-40 h-40 rounded-full bg-[#ffcc00]" 
                style={pulseStyle} 
              />
              <Animated.View 
                className="absolute w-32 h-32 rounded-full bg-[#ffcc00]/40" 
                style={pulseStyle} 
              />
              
              <View className="w-32 h-32 rounded-full bg-[#ffcc00] items-center justify-center shadow-lg" style={{ shadowColor: '#ffcc00', shadowOpacity: 0.5, shadowRadius: 20 }}>
                <Mic size={48} color="#1a1a1a" />
              </View>
            </View>

            <Animated.Text entering={FadeInDown.delay(200)} className="text-white text-2xl font-bold mt-12 text-center">
              {status === 'requesting' ? 'Preparando...' : status === 'listening' ? 'Ouvindo o ambiente...' : 'Analisando áudio...'}
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(300)} className="text-white/50 text-base mt-2 text-center px-8">
              {status === 'listening' 
                ? 'Fale perto da TV ou do rádio. O círculo vai pulsar com o som!' 
                : 'Enviando impressão digital para a nuvem...'}
            </Animated.Text>
          </>
        ) : (
          <Animated.View entering={FadeIn.duration(500)} className="items-center justify-center w-full px-6">
            <Animated.View style={successIconStyle} className="w-32 h-32 rounded-full bg-green-500/20 items-center justify-center mb-8 border-4 border-green-500/30">
              <CheckCircle size={64} color="#22c55e" />
            </Animated.View>
            
            <Text className="text-3xl font-extrabold text-white text-center mb-2">
              Sinal Reconhecido!
            </Text>
            <Text className="text-lg text-white/70 text-center mb-8">
              Você estava ouvindo <Text className="text-[#ffcc00] font-bold">{recognizedTitle}</Text>
            </Text>

            <View className="bg-[#1a1a1a] rounded-3xl p-6 w-full border border-white/10 items-center mb-8">
              <Text className="text-white/60 text-sm font-bold uppercase tracking-widest mb-2">Recompensa</Text>
              
              <View className="flex-row items-center justify-center mt-4">
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

        {/* Gamification Popup (Achievement Unlocked) */}
        {newUnlockedAchievement && (
          <Animated.View 
            entering={FadeInDown.springify()}
            exiting={FadeOutUp}
            className="absolute top-32 self-center bg-[#1a1a1a] p-4 rounded-3xl border border-white/20 shadow-2xl items-center flex-row w-[90%]"
            style={{ zIndex: 10000 }}
          >
            <View className="w-14 h-14 rounded-full bg-white/10 items-center justify-center mr-4">
              <newUnlockedAchievement.icon size={28} color={newUnlockedAchievement.color || "#ffcc00"} />
            </View>
            <View className="flex-1">
              <Text className="text-[#ffcc00] font-black text-xs uppercase tracking-widest mb-1">Conquista Desbloqueada!</Text>
              <Text className="text-white font-bold text-base">{newUnlockedAchievement.title}</Text>
              <Text className="text-white/60 text-xs mt-0.5" numberOfLines={2}>{newUnlockedAchievement.description}</Text>
            </View>
            <TouchableOpacity onPress={clearNewAchievement} className="p-2">
              <MaterialCommunityIcons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </Animated.View>
        )}

      </View>
    </View>
  );
}
