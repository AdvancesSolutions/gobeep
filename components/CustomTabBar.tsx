import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Dimensions, StyleSheet, Text, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, Users, Wallet, User, Radio, X, Mic, Camera } from 'lucide-react-native';
import Animated, { useAnimatedStyle, withSpring, FadeIn, FadeOut, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const [fabOpen, setFabOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  // Oculta o FAB "Controle TV" durante o Onboarding (antes de concluir).
  useEffect(() => {
    AsyncStorage.getItem('beep_onboarded').then((v) => setOnboarded(v === 'true')).catch(() => setOnboarded(true));
  }, []);

  const getIcon = (routeName: string, active: boolean) => {
    // Cores: preto para o ícone ativo (pois o fundo será amarelo), amarelo para inativo
    const color = active ? '#1a1a1a' : '#ffcc00';
    switch (routeName) {
      case 'index': return <Home size={22} color={color} strokeWidth={active ? 2.5 : 2} />;
      case 'social': return <Users size={22} color={color} strokeWidth={active ? 2.5 : 2} />;
      case 'wallet': return <Wallet size={22} color={color} strokeWidth={active ? 2.5 : 2} />;
      case 'profile': return <User size={22} color={color} strokeWidth={active ? 2.5 : 2} />;
      default: return <Home size={22} color={color} />;
    }
  };

  const routes = state.routes;
  const leftRoutes = routes.filter(r => r.name === 'index' || r.name === 'social');
  const rightRoutes = routes.filter(r => r.name === 'wallet' || r.name === 'profile');

  const renderTab = (route: any, index: number) => {
    const isFocused = state.index === state.routes.findIndex(r => r.key === route.key);
    
    const onPress = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <TouchableOpacity
        key={route.key}
        onPress={onPress}
        style={{
          width: 48,
          height: 48,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isFocused ? '#ffcc00' : 'transparent',
          ...(!isFocused ? {} : {
            shadowColor: '#ffcc00',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 8,
          })
        }}
      >
        {isFocused ? (
          <Animated.View entering={FadeIn.duration(200)}>
            {getIcon(route.name, isFocused)}
          </Animated.View>
        ) : (
          getIcon(route.name, isFocused)
        )}
      </TouchableOpacity>
    );
  };

  const fabStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: withSpring(fabOpen ? '45deg' : '0deg', { damping: 15 }) }]
    };
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      
      {/* FAB Overlay */}
      {fabOpen && (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 60 }]}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setFabOpen(false)} activeOpacity={1} />
          <View style={{ position: 'absolute', bottom: 130 + insets.bottom, left: 0, right: 0, alignItems: 'center', gap: 16 }}>
             
             {/* Radio Button */}
             <Animated.View entering={FadeIn.delay(50).springify().damping(15)}>
               <TouchableOpacity 
                 activeOpacity={0.8}
                 onPress={() => {
                   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                   setFabOpen(false);
                   router.push('/recognition/audio');
                 }}
                 style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
               >
                  <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#ffcc00', alignItems: 'center', justifyContent: 'center', shadowColor: '#ffcc00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}>
                     <Mic size={24} color="#1a1a1a" />
                  </View>
                  <View style={{ backgroundColor: '#1a1a1a', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                     <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Rádio — Áudio</Text>
                  </View>
               </TouchableOpacity>
             </Animated.View>

             {/* TV Button */}
             <Animated.View entering={FadeIn.delay(100).springify().damping(15)}>
               <TouchableOpacity 
                 activeOpacity={0.8}
                 onPress={() => {
                   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                   setFabOpen(false);
                   router.push('/recognition/image');
                 }}
                 style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
               >
                  <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#ffcc00', alignItems: 'center', justifyContent: 'center', shadowColor: '#ffcc00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}>
                     <Camera size={24} color="#fff" />
                  </View>
                  <View style={{ backgroundColor: '#1a1a1a', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                     <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>TV — Imagem</Text>
                  </View>
               </TouchableOpacity>
             </Animated.View>

          </View>
        </Animated.View>
      )}

      {/* Tab Bar Container */}
      <View style={{
        position: 'absolute', bottom: Math.max(insets.bottom, 16), left: 20, right: 20,
        backgroundColor: '#1a1a1a', // Preto como pedido
        borderRadius: 32,
        height: 70,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 8,
        zIndex: 70,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 32,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
      }}>
        {leftRoutes.map(renderTab)}

        {/* Center FAB */}
        {onboarded && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setFabOpen(!fabOpen);
          }}
          style={{
            width: 64, height: 64, borderRadius: 32,
            backgroundColor: '#ffcc00', // Ícone central em amarelo
            alignItems: 'center', justifyContent: 'center',
            marginTop: -36, // Sobressaindo para cima
            borderWidth: 5, borderColor: '#1a1a1a', // Borda preta combinando com a barra
            shadowColor: '#ffcc00',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4,
            shadowRadius: 24,
            elevation: 12,
          }}
        >
          <Animated.View style={fabStyle}>
             {fabOpen ? <X size={28} color="#1a1a1a" /> : <Radio size={28} color="#1a1a1a" />}
          </Animated.View>
        </TouchableOpacity>
        )}

        {rightRoutes.map(renderTab)}
      </View>
    </View>
  );
}
