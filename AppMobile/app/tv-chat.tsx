import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, FlatList, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Send, Tv } from 'lucide-react-native';
import { useTVSocket, SocketProvider } from '../src/contexts/SocketContext';
import PairingContainer from '../src/components/PairingContainer';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';

function TVChatContent() {
  const { connected, pairedRoom, pairStatus, tvOnline, sendChat, chatMessages } = useTVSocket();
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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

  const bgStyle = { flex: 1, backgroundColor: isDark ? '#0a0a0a' : 'hsl(0, 0%, 96%)', paddingTop: insets.top };
  const headerStyle = { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, backgroundColor: isDark ? '#1c1c1f' : '#ffffff', borderBottomWidth: 1, borderColor: isDark ? '#2d2d30' : '#e2e8f0' };
  const textColor = isDark ? '#ffffff' : '#000000';
  const subTextColor = isDark ? '#aaa' : '#666';

  if (!paired) {
    return (
      <View style={bgStyle}>
        <View style={headerStyle}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
            <ChevronLeft color={textColor} size={28} />
          </TouchableOpacity>
          <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 18, marginLeft: 8 }}>Conectar a TV</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
          <Text style={{ color: subTextColor, textAlign: 'center', marginBottom: 16 }}>
            {connected ? 'Conectado ao servidor' : 'Conectando ao servidor...'}
          </Text>
          <PairingContainer
            onPairSuccess={() => setPaired(true)}
            onClose={() => router.back()}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={bgStyle}>
      {/* Header */}
      <View style={headerStyle}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <ChevronLeft color={textColor} size={28} />
        </TouchableOpacity>
        
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 204, 0, 0.15)', alignItems: 'center', justifyContent: 'center', marginLeft: 8, marginRight: 12 }}>
          <Tv color="#ffcc00" size={20} />
        </View>
        
        <View style={{ flex: 1 }}>
          <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 16 }}>Chat Integrado (TV)</Text>
          <Text style={{ color: tvOnline ? '#4ade80' : '#f87171', fontSize: 12, fontWeight: '600' }}>
            {tvOnline ? 'TV Online' : 'TV Offline'}
          </Text>
        </View>
        <View style={{ backgroundColor: 'rgba(255, 204, 0, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
          <Text style={{ color: '#ffcc00', fontSize: 12, fontWeight: 'bold' }}>Sala: {pairedRoom}</Text>
        </View>
      </View>

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
              <Text style={{ fontSize: 10, color: subTextColor, marginLeft: 4, marginBottom: 2 }}>
                {isMe ? 'Eu' : 'TV'}
              </Text>
              <View 
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 16,
                  backgroundColor: isMe ? '#ffcc00' : (isDark ? '#2a2a2e' : '#ffffff'),
                  borderWidth: isMe ? 0 : 1,
                  borderColor: isDark ? 'transparent' : '#e2e8f0',
                  borderTopRightRadius: isMe ? 2 : 16,
                  borderTopLeftRadius: isMe ? 16 : 2,
                }}
              >
                <Text style={{ fontSize: 15, color: isMe ? '#000' : textColor, fontWeight: isMe ? '600' : '400' }}>
                  {item.text}
                </Text>
              </View>
            </Animated.View>
          );
        }}
        ListEmptyComponent={
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 }}>
            <Tv size={48} color={isDark ? '#444' : '#ccc'} style={{ marginBottom: 12 }} />
            <Text style={{ color: subTextColor, fontSize: 14, textAlign: 'center' }}>
              Nenhuma mensagem no chat ainda.
            </Text>
          </View>
        }
      />

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, backgroundColor: isDark ? '#0a0a0a' : 'hsl(0, 0%, 96%)', borderTopWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0', gap: 8, paddingBottom: Platform.OS === 'ios' ? 24 : 12 }}>
          <View style={{ flex: 1, backgroundColor: isDark ? '#1c1c1f' : '#ffffff', borderRadius: 24, borderWidth: 1, borderColor: isDark ? '#2d2d30' : '#e2e8f0', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, minHeight: 48 }}>
            <TextInput
              style={{ flex: 1, color: textColor, fontSize: 15, paddingVertical: 8 }}
              placeholder="Digite uma mensagem para a TV..."
              placeholderTextColor={isDark ? '#666' : '#999'}
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
              backgroundColor: inputText.trim() ? '#ffcc00' : (isDark ? '#2a2a2e' : '#e2e8f0'),
              alignItems: 'center',
              justifyContent: 'center',
            }}
            disabled={!inputText.trim()}
          >
            <Send color={inputText.trim() ? '#000' : '#888'} size={20} style={{ marginLeft: 2 }} />
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
