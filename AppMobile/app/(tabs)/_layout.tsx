import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { CustomTabBar } from '../../components/CustomTabBar';
import { io } from 'socket.io-client';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../contexts/AuthContext';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut, BounceIn } from 'react-native-reanimated';

const hostIp = Constants.expoConfig?.hostUri?.split(':')[0] || '10.0.2.2';
const socket = io(`http://${hostIp}:3001`);

export default function TabLayout() {
  const { user } = useAuth();
  const [buzz, setBuzz] = useState<{fromUser: string, emoji: string} | null>(null);

  useEffect(() => {
    socket.on('receive_buzz', (data) => {
      // Check if it's for everyone or specifically for me
      if (data.targetUser === "Todos" || data.targetUser === (user?.name || "Usuário BEEP")) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); // Heavy vibration
        
        // Triggers the big animation overlay
        setBuzz({ fromUser: data.fromUser, emoji: data.emoji });
        
        // Auto hide after 3 seconds
        setTimeout(() => setBuzz(null), 3500);
      }
    });

    return () => {
      socket.off('receive_buzz');
    };
  }, [user]);

  return (
    <>
      <Tabs 
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="social" />
        <Tabs.Screen name="wallet" />
        <Tabs.Screen name="profile" />
      </Tabs>

      {/* Global Buzz Overlay */}
      {buzz && (
        <Animated.View 
          entering={FadeIn.duration(300)} 
          exiting={FadeOut.duration(500)}
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, justifyContent: 'center', alignItems: 'center' }]}
        >
          <Animated.Text entering={BounceIn.springify().damping(12).stiffness(90)} style={{ fontSize: 160 }}>
            {buzz.emoji}
          </Animated.Text>
          <Animated.View entering={ZoomIn.delay(300).springify()} style={{ marginTop: 20, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 30 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', textAlign: 'center' }}>
              BUZZ de {buzz.fromUser}!
            </Text>
          </Animated.View>
        </Animated.View>
      )}
    </>
  );
}
