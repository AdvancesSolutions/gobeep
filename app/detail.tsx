import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Dimensions, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Share2, X, CalendarPlus, Star, ChevronRight, Phone, Disc3, Search, Play, Pause, Radio, Tv } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing } from 'react-native-reanimated';

// Dados simulados baseados em stations.ts
import { getStation, sessions, stations } from '../data/stations';

const radioTracks = [
  { title: "Blinding Lights", artist: "The Weeknd", time: "14:03", duration: "3:22", genre: "Synthwave" },
  { title: "Levitating", artist: "Dua Lipa", time: "14:07", duration: "3:23", genre: "Disco Pop" },
  { title: "Peaches", artist: "Justin Bieber", time: "14:12", duration: "3:18", genre: "R&B" },
  { title: "Stay", artist: "The Kid LAROI", time: "14:18", duration: "2:21", genre: "Pop Rap" },
];

const tvTracks = [
  { title: "Tema de Abertura", artist: "Novela das 9", time: "21:00", duration: "1:30", genre: "Trilha Sonora" },
  { title: "Comercial Coca-Cola", artist: "Anúncio", time: "21:15", duration: "0:30", genre: "Comercial" },
  { title: "Vinheta Jornal", artist: "TV Globo", time: "20:00", duration: "0:15", genre: "Vinheta" },
  { title: "As It Was", artist: "Harry Styles", time: "21:32", duration: "2:47", genre: "Pop" },
  { title: "Comercial Itaú", artist: "Anúncio", time: "21:45", duration: "0:30", genre: "Comercial" },
];

export default function RecognitionDetail() {
  const { sessionId } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  const [search, setSearch] = useState("");
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  // Fallback
  const sessionIdNum = Array.isArray(sessionId) ? parseInt(sessionId[0]) : parseInt(sessionId as string);
  const session = sessions.find((s) => s.id === (sessionIdNum || 1)) || sessions[0];
  const station = getStation(session.stationId) || stations[0];
  
  const isTV = station.type === "tv";
  const tracks = isTV ? tvTracks : radioTracks;

  const filteredTracks = tracks.filter((t) => {
    const q = search.toLowerCase();
    return t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q);
  });

  const togglePlay = (index: number) => {
    if (playingIndex === index) {
      setPlayingIndex(null);
    } else {
      setPlayingIndex(index);
    }
  };

  const StationIcon = isTV ? Tv : Radio;

  return (
    <View style={{ flex: 1, backgroundColor: 'hsl(0, 0%, 96%)' }} className="dark:bg-[#0a0a0a]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Header Black Area */}
        <View className="bg-card-dark px-5 pb-8 rounded-b-[40px]" style={{ paddingTop: insets.top + 20 }}>
          <View className="flex-row items-center justify-between mb-8">
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-10 h-10 rounded-full bg-primary items-center justify-center"
              >
                <ChevronLeft size={22} color="#1c1c1e" />
              </TouchableOpacity>
              <Text className="text-sm font-medium text-card-dark-foreground/80">Jan 17, Sábado</Text>
            </View>
            <View className="bg-card-dark-foreground/10 rounded-full px-3 py-1.5">
              <Text className="text-xs font-bold text-card-dark-foreground">{session.time}</Text>
            </View>
          </View>

          {/* Main Card */}
          <Animated.View entering={FadeInDown.delay(200)} className="bg-card rounded-3xl p-6 shadow-sm overflow-hidden relative">
            <View className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full" />
            
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="text-xs font-bold text-primary uppercase tracking-wider mb-1.5">Reconhecimento</Text>
                <Text className="text-2xl font-black text-foreground">{station.name}</Text>
                <Text className="text-sm text-muted-foreground mt-1 font-medium">{session.duration} de gravação • {session.tracks} faixas</Text>
              </View>
              
              <View className="bg-card-dark rounded-2xl px-4 py-3 items-center justify-center min-w-[70px]">
                {isTV ? (
                  <>
                    <Tv size={24} color="#ffcc00" className="mb-1" />
                    <Text className="text-[10px] font-bold text-card-dark-foreground opacity-80">{station.freq}</Text>
                  </>
                ) : (
                  <>
                    <Text className="text-xl font-extrabold text-card-dark-foreground leading-none">{station.freq.replace(" FM", "")}</Text>
                    <Text className="text-[10px] font-bold text-primary mt-1">FM</Text>
                  </>
                )}
              </View>
            </View>

            {/* Simulated Waveform */}
            <View className="flex-row items-end justify-between mt-8 h-12 gap-1">
              {Array.from({ length: 30 }).map((_, i) => {
                const h = Math.max(15, Math.random() * 100);
                return (
                  <View
                    key={i}
                    className="flex-1 rounded-full bg-primary/40"
                    style={{ height: `${h}%` }}
                  />
                );
              })}
            </View>

            <View className="flex-row items-center justify-between mt-6 pt-5 border-t border-border">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full bg-primary items-center justify-center">
                  <StationIcon size={20} color="#1c1c1e" />
                </View>
                <View>
                  <Text className="font-bold text-base text-foreground">{station.name}</Text>
                  <Text className="text-xs text-muted-foreground">{station.location?.split(" - ")[1] || "Brasil"}</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-1.5 bg-primary rounded-full px-3 py-1.5">
                <Star size={14} color="#1c1c1e" fill="#1c1c1e" />
                <Text className="text-sm font-bold text-card-dark">{station.rating}</Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Action Buttons */}
        <Animated.View entering={FadeInDown.delay(300)} className="flex-row justify-center gap-6 py-6 border-b border-border mx-5">
          {[
            { icon: Share2, label: "Compartilhar", dark: false },
            { icon: X, label: "Descartar", dark: true, action: () => router.push('/') },
            { icon: CalendarPlus, label: "Salvar", dark: false },
          ].map((action, i) => (
            <TouchableOpacity key={action.label} onPress={action.action} className="items-center gap-2">
              <View className={`w-14 h-14 rounded-full flex items-center justify-center ${action.dark ? "bg-card-dark" : "bg-primary"}`}>
                <action.icon size={22} color={action.dark ? "#fff" : "#1c1c1e"} />
              </View>
              <Text className="text-xs font-bold text-foreground">{action.label}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Tracks List */}
        <Animated.View entering={FadeInDown.delay(400)} className="px-5 pt-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="font-bold text-lg text-foreground">{isTV ? "Conteúdo Identificado" : "Faixas Identificadas"}</Text>
            <View className="bg-muted rounded-full px-3 py-1">
              <Text className="text-xs text-muted-foreground font-bold">{filteredTracks.length} {isTV ? "itens" : "músicas"}</Text>
            </View>
          </View>

          <View className="relative mb-5 flex-row items-center bg-card border border-border rounded-2xl px-4 py-3">
            <Search size={18} color="#666" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={isTV ? "Buscar conteúdo..." : "Buscar música..."}
              placeholderTextColor="#999"
              className="flex-1 ml-3 text-sm text-foreground"
            />
          </View>

          <View className="gap-2">
            {filteredTracks.map((track, i) => (
              <Animated.View key={i} entering={FadeInDown.delay(500 + i * 50)} className="flex-row items-center gap-4 p-4 bg-card rounded-2xl border border-border shadow-sm">
                <TouchableOpacity
                  onPress={() => togglePlay(i)}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${playingIndex === i ? 'bg-primary' : 'bg-primary/15'}`}
                >
                  {playingIndex === i ? (
                    <Pause size={20} color="#1c1c1e" />
                  ) : (
                    <Play size={20} color="#ffcc00" style={{ marginLeft: 3 }} />
                  )}
                </TouchableOpacity>
                <View className="flex-1">
                  <Text className="font-bold text-base text-foreground" numberOfLines={1}>{track.title}</Text>
                  <View className="flex-row items-center gap-2 mt-1">
                    <Text className="text-xs text-muted-foreground" numberOfLines={1}>{track.artist}</Text>
                    <View className="bg-accent/10 px-2 py-0.5 rounded-full">
                      <Text className="text-[10px] font-bold text-accent">{track.genre}</Text>
                    </View>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-sm font-bold text-foreground">{track.time}</Text>
                  <Text className="text-[11px] text-muted-foreground mt-1">{track.duration}</Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Station Contact & CTA */}
        <Animated.View entering={FadeInDown.delay(700)} className="px-5 mt-6 gap-3">
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/stationprofile', params: { stationId: station.id } })}
            className="flex-row items-center justify-between p-4 bg-card rounded-2xl border border-border"
          >
            <View className="flex-row items-center gap-4">
              <View className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <StationIcon size={22} color="#666" />
              </View>
              <View>
                <Text className="font-bold text-base text-foreground">{station.name}</Text>
                <Text className="text-xs text-muted-foreground mt-0.5">{station.location?.split(" - ")[0] || station.freq}</Text>
              </View>
            </View>
            <ChevronRight size={22} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity className="bg-card-dark rounded-2xl py-4 flex-row items-center justify-center gap-3">
            <Phone size={18} color="#fff" />
            <Text className="text-sm font-bold text-card-dark-foreground">{station.phone || "Sem telefone"}</Text>
          </TouchableOpacity>

          <TouchableOpacity className="bg-primary rounded-2xl py-4 flex-row items-center justify-center gap-3 shadow-md">
            <Disc3 size={18} color="#1c1c1e" />
            <Text className="text-sm font-extrabold text-card-dark">Reconhecimento em Tempo Real</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Reviews */}
        <Animated.View entering={FadeInDown.delay(800)} className="px-5 mt-8 pb-8">
          <View className="flex-row items-center justify-between mb-5">
            <Text className="font-bold text-lg text-foreground">Avaliações</Text>
            <Text className="text-sm text-muted-foreground">Ordenar por <Text className="font-bold text-foreground">Data ▾</Text></Text>
          </View>

          {[
            { name: "Ana Silva", date: "Jan 1, 2026", text: isTV ? "Identificou perfeitamente os comerciais e vinhetas da programação. Excelente!" : "App incrível! Identificou todas as músicas que estavam tocando na rádio. Super preciso e rápido.", initial: "A" },
            { name: "Carlos M.", date: "Dez 28, 2025", text: isTV ? "Ótimo para monitorar conteúdo televisivo. Reconhece trilhas e comerciais." : "Muito bom para monitoramento de emissoras. Recomendo!", initial: "C" },
          ].map((review, i) => (
            <Animated.View key={i} entering={FadeInDown.delay(900 + i * 100)} className="flex-row items-start gap-4 mb-6">
              <View className="w-10 h-10 rounded-full bg-primary items-center justify-center">
                <Text className="text-card-dark text-sm font-black">{review.initial}</Text>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center justify-between">
                  <Text className="font-bold text-sm text-foreground">{review.name}</Text>
                  <Text className="text-xs text-muted-foreground">{review.date}</Text>
                </View>
                <View className="flex-row gap-0.5 my-1.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={12} color="#ffcc00" fill="#ffcc00" />
                  ))}
                </View>
                <Text className="text-sm text-muted-foreground leading-relaxed">{review.text}</Text>
              </View>
            </Animated.View>
          ))}
        </Animated.View>

      </ScrollView>
    </View>
  );
}
