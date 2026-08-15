import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotificationsAsync } from '../src/utils/notifications';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import React, { useState } from 'react';
import Animated, { FadeOut, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { View, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { beepLogoBase64 } from '../constants/logos';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);



  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

import { LogBox } from 'react-native';

LogBox.ignoreLogs(['expo-notifications', 'Possible Unhandled Promise Rejection']);

// Inicia as configurações globais de Push Notification fora do componente principal
registerForPushNotificationsAsync().catch(err => {
  console.log('\n\n================ PUSH NOTIFICATION ERROR ================');
  console.log(err);
  console.log('=========================================================\n\n');
});

// Listeners de Notificação para reagir quando o usuário clica no banner
Notifications.addNotificationResponseReceivedListener(response => {
  const url = response.notification.request.content.data.url;
  if (url) {
    // Redireciona o usuário para a tela específica enviada na notificação
    setTimeout(() => {
      router.push(url as any);
    }, 500);
  }
});

import { NotificationsProvider } from '../contexts/NotificationsContext';
import { PointsProvider } from '../contexts/PointsContext';
import { GamificationProvider } from '../contexts/GamificationContext';

import { StatusBar } from 'expo-status-bar';

import * as Updates from 'expo-updates';

function RootLayoutNav() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [showSplash, setShowSplash] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const progressWidth = useSharedValue(0);

  // Sincroniza o tema salvo no onboarding com o nativewind (aplica classe 'dark' no root).
  useEffect(() => {
    AsyncStorage.getItem('beep_theme').then((saved) => {
      if (saved === 'dark' || saved === 'light') {
        setColorScheme(saved);
      }
    }).catch(() => {});
  }, [setColorScheme]);

  // Checagem de atualizações OTA (EAS Update)
  useEffect(() => {
    async function checkOTA() {
      if (__DEV__) return; // Ignora em desenvolvimento
      try {
        const check = await Updates.checkForUpdateAsync();
        if (check.isAvailable) {
          setIsUpdating(true);
          progressWidth.value = withTiming(100, { duration: 8000 }); // simula barra de progresso em 8s
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (e) {
        console.log("Erro no check de atualizações:", e);
      }
    }
    checkOTA();
  }, []);

  const progressBarAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const navTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
      <ThemeProvider value={navTheme}>
      <NotificationsProvider>
        <PointsProvider>
          <GamificationProvider>
            <StatusBar style="light" translucent />
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="chat" options={{ headerShown: false }} />
              <Stack.Screen name="tv-chat" options={{ headerShown: false }} />
              <Stack.Screen name="recognition" options={{ headerShown: false }} />
              <Stack.Screen name="presenter" options={{ headerShown: false }} />
              <Stack.Screen name="advertiser" options={{ headerShown: false }} />
              <Stack.Screen name="director" options={{ headerShown: false }} />
              <Stack.Screen name="politician" options={{ headerShown: false }} />
              <Stack.Screen name="audio-director" options={{ headerShown: false }} />
              <Stack.Screen name="stationprofile" options={{ headerShown: false }} />
              <Stack.Screen name="detail" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            {showSplash && <AnimatedSplashScreen onFinish={() => setShowSplash(false)} />}

            {/* Modal de Progresso do OTA */}
            {isUpdating && (
              <View style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: 'rgba(0,0,0,0.85)',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 99999,
              }}>
                <View style={{
                  width: '80%',
                  backgroundColor: '#1c1c1e',
                  borderRadius: 24,
                  padding: 24,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#ffcc00',
                  shadowColor: '#000',
                  shadowOpacity: 0.5,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 5 }
                }}>
                  <Image source={{ uri: beepLogoBase64 }} style={{ width: 64, height: 64, marginBottom: 16 }} resizeMode="contain" />
                  <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
                    Atualizando o App... 🐝
                  </Text>
                  <Text style={{ color: '#aaa', fontSize: 13, textAlign: 'center', marginBottom: 24, lineHeight: 18 }}>
                    Baixando novos recursos. O aplicativo será reiniciado em instantes para aplicar as novidades.
                  </Text>
                  
                  <View style={{ width: '100%', height: 6, backgroundColor: '#333', borderRadius: 3, overflow: 'hidden' }}>
                    <Animated.View style={[{
                      height: '100%',
                      backgroundColor: '#ffcc00',
                      borderRadius: 3,
                    }, progressBarAnimatedStyle]} />
                  </View>
                </View>
              </View>
            )}
          </GamificationProvider>
        </PointsProvider>
      </NotificationsProvider>
      </ThemeProvider>
  );
}

function AnimatedSplashScreen({ onFinish }: { onFinish: () => void }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.15);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.3, { duration: 1000 }), withTiming(1, { duration: 1000 })),
      -1, true
    );
    opacity.value = withRepeat(
      withSequence(withTiming(0.4, { duration: 1000 }), withTiming(0.15, { duration: 1000 })),
      -1, true
    );
    
    const timeout = setTimeout(() => {
      onFinish();
    }, 2500);
    
    return () => clearTimeout(timeout);
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    width: 200, height: 200,
    backgroundColor: '#ffcc00',
    borderRadius: 100,
    position: 'absolute',
  }));

  return (
    <Animated.View exiting={FadeOut.duration(800)} style={[StyleSheet.absoluteFill, { zIndex: 9999, justifyContent: 'center', alignItems: 'center' }]}>
      <LinearGradient colors={['#1c1c1e', '#0a0a0a']} style={StyleSheet.absoluteFill} />
      <Animated.View style={glowStyle} />
      <Image source={{ uri: beepLogoBase64 }} style={{ width: 140, height: 140, zIndex: 10 }} resizeMode="contain" />
    </Animated.View>
  );
}
