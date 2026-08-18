import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import { router } from 'expo-router';
import { Send, Tv } from 'lucide-react-native';
import { useTVSocket, SocketProvider } from '../src/contexts/SocketContext';
import PairingContainer from '../src/components/PairingContainer';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { PageHeader } from '../components/PageHeader';
import { usePoints } from '../contexts/PointsContext';

function TVChatContent() {
  const { connected, pairedRoom, pairStatus, tvOnline, sendChat, sendReaction, chatMessages } = useTVSocket();
  const { totalPoints } = usePoints();
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const [paired, setPaired] = useState(false);

  if (pairStatus === 'paired' && !paired) setPaired(true);

  useEffect(() => {
    if (chatMessages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [chatMessages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendChat(inputText);
    setInputText("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  if (!paired) {
    return (
      <View className="flex-1 bg-background">
        <PageHeader title="Conectar TV" totalPoints={totalPoints} />

        <Animated.ScrollView
          entering={FadeInUp.springify()}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-muted-foreground text-sm text-center mb-4">
            {connected ? 'Conectado ao servidor' : 'Conectando ao servidor...'}
          </Text>

          <PairingContainer
            onPairSuccess={() => setPaired(true)}
            onClose={() => router.back()}
          />
        </Animated.ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <PageHeader title="Chat TV" totalPoints={totalPoints} />

      {/* Status */}
      <View className="flex-row items-center justify-between px-4 py-2">
        <View className="flex-row items-center gap-2">
          <View className="w-1.5 h-1.5 rounded-full bg-primary" />
          <Text className="font-bold text-sm text-foreground">Chat Integrado</Text>
        </View>
        <View className="flex-row items-center gap-2 bg-primary/15 px-3 py-1.5 rounded-full">
          <Tv color="#ffcc00" size={14} />
          <Text className="text-primary text-xs font-bold">
            {tvOnline ? 'TV Online' : 'TV Offline'}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center px-4 pb-2">
        <Text className="text-muted-foreground text-xs">Sala: {pairedRoom}</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          style={{ flex: 1, paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingVertical: 16, gap: 12 }}
        data={chatMessages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => {
          const isMe = item.from === 'mobile';
          return (
            <Animated.View
              entering={FadeInUp.springify()}
              style={{
                maxWidth: '80%',
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                marginBottom: 4,
              }}
            >
              <Text className="text-[10px] text-muted-foreground ml-1 mb-1">
                {isMe ? 'Eu' : 'TV'}
              </Text>
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 16,
                  backgroundColor: isMe ? '#ffcc00' : '#ffffff',
                  borderWidth: isMe ? 0 : 1,
                  borderColor: '#e2e8f0',
                  borderTopRightRadius: isMe ? 2 : 16,
                  borderTopLeftRadius: isMe ? 16 : 2,
                }}
              >
                <Text style={{ fontSize: 15, color: isMe ? '#000000' : '#1a1a1a', fontWeight: isMe ? '600' : '400' }}>
                  {item.text}
                </Text>
              </View>
            </Animated.View>
          );
        }}
        ListEmptyComponent={
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 }}>
            <Tv size={48} color="#cccccc" style={{ marginBottom: 12 }} />
            <Text style={{ color: '#666666', fontSize: 14, textAlign: 'center' }}>
              Nenhuma mensagem no chat ainda.
            </Text>
          </View>
        }
       />

      {/* Barra de reações (devem aparecer no chat também) */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 8,
          paddingHorizontal: 12,
          paddingBottom: 8,
        }}
      >
        {['🔥', '❤️', '😂', '😮', '👏', '🎉', '💛', '⚡'].map((e) => (
          <TouchableOpacity
            key={e}
            onPress={() => {
              sendReaction(e);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#ffffff',
              borderWidth: 1,
              borderColor: '#e2e8f0',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 22 }}>{e}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Input */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 12,
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderColor: '#e2e8f0',
            gap: 8,
            paddingBottom: (Platform.OS === 'ios' ? 24 : 12) + insets.bottom,
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: '#ffffff',
              borderRadius: 24,
              borderWidth: 1,
              borderColor: '#e2e8f0',
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              minHeight: 48,
            }}
          >
            <TextInput
              style={{ flex: 1, color: '#1a1a1a', fontSize: 15, paddingVertical: 8 }}
              placeholder="Digite uma mensagem para a TV..."
              placeholderTextColor="#999999"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
            />
          </View>

          <TouchableOpacity
            onPress={handleSend}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: inputText.trim() ? '#ffcc00' : '#e2e8f0',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            disabled={!inputText.trim()}
          >
            <Send color={inputText.trim() ? '#000000' : '#888888'} size={20} style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

export default function TVChatScreen() {
  return (
    <SocketProvider>
      <TVChatContent />
    </SocketProvider>
  );
}
