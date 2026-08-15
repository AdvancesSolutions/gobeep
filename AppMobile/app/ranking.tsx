import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Trophy, Medal, ArrowUpRight, ArrowDownRight, Minus, Crown } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePoints } from '../contexts/PointsContext';
import { useAuth } from '../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const GHOSTS = [
  { id: '1', name: 'Ana Silva', initialScore: 1450, avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Ana' },
  { id: '2', name: 'Carlos_DJ', initialScore: 1420, avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Carlos' },
  { id: '3', name: 'Marina TV', initialScore: 1390, avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Marina' },
  { id: '4', name: 'João Victor', initialScore: 1350, avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Joao' },
  { id: '5', name: 'Luiza Lima', initialScore: 1310, avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Luiza' },
  { id: '6', name: 'Roberto99', initialScore: 1250, avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Roberto' },
  { id: '7', name: 'Clara_Beep', initialScore: 1200, avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Clara' },
  { id: '8', name: 'Eduardo M.', initialScore: 1100, avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Edu' },
  { id: '9', name: 'Beatriz F.', initialScore: 1050, avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Bia' },
  { id: '10', name: 'Marcelo K.', initialScore: 900, avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Marcelo' },
];

export default function RankingScreen() {
  const insets = useSafeAreaInsets();
  const { totalPoints } = usePoints();
  const { user } = useAuth();
  
  const [ghosts, setGhosts] = useState(GHOSTS.map(g => ({ ...g, score: g.initialScore, prevScore: g.initialScore })));
  
  // Efeito simulador de concorrência
  useEffect(() => {
    const interval = setInterval(() => {
      setGhosts(prev => prev.map(g => {
        // Alguém ganha pontos aleatoriamente (25% de chance a cada tick)
        if (Math.random() > 0.75) {
          return { ...g, prevScore: g.score, score: g.score + Math.floor(Math.random() * 15) + 5 };
        }
        return g;
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fullRanking = useMemo(() => {
    const me = {
      id: 'me',
      name: user?.name || 'Você',
      score: totalPoints,
      avatar: user?.avatar || 'https://api.dicebear.com/7.x/avataaars/png?seed=Me',
      isMe: true
    };
    
    // Sort descending
    const combined = [...ghosts, me].sort((a, b) => b.score - a.score);
    
    // Add positional data
    return combined.map((player, index) => ({
      ...player,
      position: index + 1
    }));
  }, [ghosts, totalPoints, user]);

  const myPosition = fullRanking.findIndex(p => p.isMe) + 1;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-2 py-3 bg-card border-b border-border shadow-sm">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ChevronLeft color="#fff" size={28} />
        </TouchableOpacity>
        <View className="items-center flex-1 mr-8">
          <Text className="text-white font-black text-lg">Liga Prata</Text>
          <Text className="text-muted-foreground text-xs font-semibold">Termina em 2d 14h</Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Pódio 3D */}
        <Animated.View entering={FadeInDown.delay(200).springify()} className="flex-row items-end justify-center h-56 mt-4 mb-8 px-4">
          
          {/* Segundo Lugar (Esquerda) */}
          <View className="items-center z-10" style={{ marginRight: -10 }}>
            <View className="relative">
              <Image source={{ uri: fullRanking[1]?.avatar }} className="w-14 h-14 rounded-full border-4 border-gray-400 mb-2" />
              <View className="absolute -bottom-1 -right-1 bg-gray-400 w-5 h-5 rounded-full items-center justify-center border-2 border-background">
                <Text className="text-[10px] font-bold text-black">2</Text>
              </View>
            </View>
            <Text className="text-white text-xs font-bold w-20 text-center" numberOfLines={1}>{fullRanking[1]?.name}</Text>
            <Text className="text-muted-foreground text-[10px] mb-2">{fullRanking[1]?.score} pts</Text>
            <LinearGradient colors={['#9ca3af', '#4b5563']} className="w-20 h-24 rounded-t-xl opacity-90 border-t border-x border-gray-300/30" />
          </View>

          {/* Primeiro Lugar (Centro) */}
          <View className="items-center z-20">
            <Crown color="#ffcc00" size={28} style={{ marginBottom: 4 }} />
            <View className="relative">
              <Image source={{ uri: fullRanking[0]?.avatar }} className="w-20 h-20 rounded-full border-4 border-[#ffcc00] mb-2 shadow-lg shadow-yellow-500/50" />
              <View className="absolute -bottom-2 -right-2 bg-[#ffcc00] w-7 h-7 rounded-full items-center justify-center border-2 border-background">
                <Text className="text-xs font-bold text-black">1</Text>
              </View>
            </View>
            <Text className="text-white text-sm font-black w-24 text-center" numberOfLines={1}>{fullRanking[0]?.name}</Text>
            <Text className="text-yellow-500 text-[11px] font-bold mb-2">{fullRanking[0]?.score} pts</Text>
            <LinearGradient colors={['#ffcc00', '#d97706']} className="w-24 h-32 rounded-t-xl border-t border-x border-yellow-200/50" />
          </View>

          {/* Terceiro Lugar (Direita) */}
          <View className="items-center z-10" style={{ marginLeft: -10 }}>
            <View className="relative">
              <Image source={{ uri: fullRanking[2]?.avatar }} className="w-14 h-14 rounded-full border-4 border-amber-600 mb-2" />
              <View className="absolute -bottom-1 -left-1 bg-amber-600 w-5 h-5 rounded-full items-center justify-center border-2 border-background">
                <Text className="text-[10px] font-bold text-white">3</Text>
              </View>
            </View>
            <Text className="text-white text-xs font-bold w-20 text-center" numberOfLines={1}>{fullRanking[2]?.name}</Text>
            <Text className="text-muted-foreground text-[10px] mb-2">{fullRanking[2]?.score} pts</Text>
            <LinearGradient colors={['#d97706', '#92400e']} className="w-20 h-20 rounded-t-xl opacity-90 border-t border-x border-amber-500/30" />
          </View>

        </Animated.View>

        {/* Lista de Ranking Restante */}
        <View className="bg-card rounded-t-[32px] px-4 pt-6 pb-4 flex-1 shadow-black shadow-2xl">
          <Text className="text-white font-bold text-base mb-4 ml-2">Classificação Global</Text>
          
          <View className="gap-2.5">
            {fullRanking.slice(3).map((player, index) => {
              const isMe = player.isMe;
              return (
                <Animated.View 
                  key={player.id} 
                  layout={LinearTransition.springify().damping(15)}
                  className={`flex-row items-center p-3 rounded-2xl border ${isMe ? 'bg-primary/10 border-primary/30' : 'bg-muted/50 border-border'}`}
                >
                  <Text className={`w-8 text-center font-black ${isMe ? 'text-primary' : 'text-muted-foreground'}`}>
                    {player.position}
                  </Text>
                  
                  <Image source={{ uri: player.avatar }} className="w-10 h-10 rounded-full bg-background ml-2 mr-3" />
                  
                  <View className="flex-1">
                    <Text className={`font-bold ${isMe ? 'text-primary' : 'text-foreground'}`}>
                      {player.name} {isMe ? '(Você)' : ''}
                    </Text>
                    <Text className="text-xs text-muted-foreground">Liga Prata</Text>
                  </View>
                  
                  <View className="items-end">
                    <Text className={`font-black ${isMe ? 'text-primary' : 'text-foreground'}`}>
                      {player.score} pts
                    </Text>
                    {player.prevScore && player.score > player.prevScore && (
                      <Animated.View entering={FadeIn}>
                        <Text className="text-green-500 text-[10px] font-bold">+{player.score - player.prevScore} ↑</Text>
                      </Animated.View>
                    )}
                  </View>
                </Animated.View>
              );
            })}
          </View>
        </View>

      </ScrollView>

      {/* Sticky Bar if user is low on the rank */}
      {myPosition > 3 && (
        <Animated.View entering={FadeInDown.delay(500)} className="absolute bottom-6 left-4 right-4 bg-primary rounded-2xl p-4 flex-row items-center justify-between shadow-lg shadow-primary/30">
          <View className="flex-row items-center gap-3">
            <View className="bg-black/20 w-10 h-10 rounded-full items-center justify-center">
              <Text className="text-black font-black text-lg">#{myPosition}</Text>
            </View>
            <View>
              <Text className="text-black font-black text-base">Sua Posição</Text>
              <Text className="text-black/70 text-xs font-semibold">{totalPoints} Bips acumulados</Text>
            </View>
          </View>
          <Trophy color="#000" size={24} />
        </Animated.View>
      )}

    </View>
  );
}
