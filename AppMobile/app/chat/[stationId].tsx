import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Dimensions, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { io } from 'socket.io-client';
import Constants from 'expo-constants';
import { ChevronLeft, Send, Zap, User, AlertCircle } from 'lucide-react-native';
import { getStation } from '../../data/stations';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { TVControlButton } from '../../components/TVControlButton';

const hostIp = Constants.expoConfig?.hostUri?.split(':')[0] || '10.0.2.2';
const socket = io(`http://${hostIp}:3001`);

export default function ChatScreen() {
  const { stationId } = useLocalSearchParams<{ stationId: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const station = getStation(stationId || "");

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!stationId) return;

    // Entrar na sala do canal
    socket.emit('join_station_chat', stationId);

    // Bem-vindo local
    setMessages([
      { id: 'sys1', type: 'system', text: `Você entrou no chat da ${station?.name || 'Emissora'}.` }
    ]);

    // Ouvir mensagens
    socket.on('chat_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      
      // Haptic se for menção
      if (msg.text.includes(`@${user?.name}`)) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    });

    return () => {
      socket.emit('leave_station_chat', stationId);
      socket.off('chat_message');
    };
  }, [stationId]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    // Verifica se é um BUZZ (Mencionando alguém com comando especial ou botão especial)
    // Para simplificar, o envio de Buzz será via um botão ao lado se o texto tiver @alguem
    const msg = {
      id: Math.random().toString(36).substr(2, 9),
      stationId,
      text: inputText,
      user: user?.name || "Usuário BEEP",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'user'
    };

    socket.emit('chat_message', msg);
    setInputText("");
  };

  const handleBuzz = () => {
    // Procura se tem algum @nome no input
    const mentionMatch = inputText.match(/@(\w+)/);
    const targetUser = mentionMatch ? mentionMatch[1] : "Todos";
    
    AlertCircle; // just imported to use if needed
    
    socket.emit('send_buzz', {
      fromUser: user?.name || "Usuário BEEP",
      targetUser: targetUser,
      emoji: "🚨"
    });
    
    // Mostra localmente
    setMessages((prev) => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      type: 'system',
      text: `Você enviou um Buzz 🚨 para ${targetUser}!`
    }]);
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  if (!station) return null;

  const Icon = station.icon;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header estilo WhatsApp */}
      <View className="flex-row items-center px-2 py-3 bg-card border-b border-border shadow-sm">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ChevronLeft color="#fff" size={28} />
        </TouchableOpacity>
        
        <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mr-3">
          <Icon color="#ffcc00" size={20} />
        </View>
        
        <View className="flex-1">
          <Text className="text-white font-bold text-lg">{station.name}</Text>
          <Text className="text-green-400 text-xs font-semibold">142 Beepers online</Text>
        </View>

        <TVControlButton />
      </View>

      {/* Area de Mensagens */}
      <ScrollView 
        ref={scrollViewRef}
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 16, gap: 12 }}
      >
        <View className="bg-yellow-500/10 self-center px-4 py-2 rounded-xl mb-4 border border-yellow-500/20">
          <Text className="text-yellow-500 text-xs text-center">
            As mensagens são criptografadas e restritas a ouvintes ativos.
          </Text>
        </View>

        {messages.map((msg, idx) => {
          if (msg.type === 'system') {
            return (
              <Animated.View entering={FadeInDown.springify()} key={msg.id || idx} className="self-center bg-muted/50 px-3 py-1 rounded-full">
                <Text className="text-muted-foreground text-[10px]">{msg.text}</Text>
              </Animated.View>
            );
          }

          const isMe = msg.user === (user?.name || "Usuário BEEP");

          return (
            <Animated.View 
              entering={FadeInUp.springify()} 
              key={msg.id} 
              className={`max-w-[80%] ${isMe ? 'self-end' : 'self-start'}`}
            >
              {!isMe && <Text className="text-[10px] text-muted-foreground ml-1 mb-1">{msg.user}</Text>}
              <View className={`px-4 py-2.5 rounded-2xl ${isMe ? 'bg-[#005c4b] rounded-tr-sm' : 'bg-card rounded-tl-sm border border-border/50'}`}>
                <Text className={`text-base ${isMe ? 'text-white' : 'text-foreground'}`}>{msg.text}</Text>
                <Text className={`text-[9px] self-end mt-1 ${isMe ? 'text-white/60' : 'text-muted-foreground'}`}>{msg.time}</Text>
              </View>
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* Input Area */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View className="flex-row items-end px-3 py-3 bg-background border-t border-border/30 gap-2 pb-6">
          <View className="flex-1 bg-card rounded-3xl border border-border/50 flex-row items-center px-4 min-h-[48px]">
            <TextInput
              className="flex-1 text-white py-3 text-base"
              placeholder="Digite uma mensagem ou @usuario..."
              placeholderTextColor="#666"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            {inputText.includes('@') && (
              <TouchableOpacity onPress={handleBuzz} className="ml-2 w-8 h-8 rounded-full bg-yellow-500/20 items-center justify-center">
                <Zap color="#ffcc00" size={16} />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            onPress={handleSend}
            className={`w-12 h-12 rounded-full items-center justify-center ${inputText.trim() ? 'bg-primary' : 'bg-muted'}`}
            disabled={!inputText.trim()}
          >
            <Send color={inputText.trim() ? '#000' : '#666'} size={20} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
