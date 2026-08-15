import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Dimensions, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, MapPin, Phone, Globe, Gift, Headphones, Users, Search, ChevronRight, Star, Clock, Music, Mic, Heart, ExternalLink, Radio, Tv } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, SlideInRight } from 'react-native-reanimated';

// Dados simulados baseados em stations.ts
import { getStation, stations } from '../data/stations';
import { beepLogoBase64 } from '../constants/logos';

const { width } = Dimensions.get('window');

const categories = ["Todos", "Música", "Esportes", "Notícias", "Entretenimento"];

const radioPrograms = [
  { name: "Manhã Total", time: "06:00 - 10:00", host: "João Silva", live: true },
  { name: "Rock das Antigas", time: "10:00 - 12:00", host: "Maria Costa", live: false },
  { name: "Notícias em Foco", time: "12:00 - 13:00", host: "Pedro Santos", live: false },
  { name: "Tarde Sertaneja", time: "14:00 - 18:00", host: "Ana Lima", live: false },
  { name: "Esportes ao Vivo", time: "18:00 - 20:00", host: "Carlos M.", live: false },
];

const tvPrograms = [
  { name: "Jornal Nacional", time: "20:00 - 21:00", host: "William Bonner", live: true },
  { name: "Novela das 9", time: "21:00 - 22:00", host: "Elenco", live: false },
  { name: "Fantástico", time: "20:30 - 23:00", host: "Poliana Abritta", live: false },
  { name: "Encontro", time: "10:00 - 12:00", host: "Patrícia Poeta", live: false },
  { name: "Globo Esporte", time: "12:45 - 13:15", host: "Felipe Andreoli", live: false },
];

export default function StationProfile() {
  const { stationId } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [isFavorite, setIsFavorite] = useState(false);

  // Fallback para a primeira emissora se o id não for encontrado
  const stationIdString = Array.isArray(stationId) ? stationId[0] : stationId;
  const station = getStation(stationIdString) || stations[0];
  const isTV = station.type === "tv";
  const programs = isTV ? tvPrograms : radioPrograms;

  const stats = [
    { label: isTV ? "Audiência" : "Ouvintes", value: station.listeners || "—", icon: Users },
    { label: "Programas", value: String(station.programs || 0), icon: Mic },
    { label: "No ar desde", value: station.since || "—", icon: isTV ? Tv : Radio },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: 'hsl(0, 0%, 96%)' }} className="dark:bg-[#0a0a0a]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Hero Section */}
        <View className="w-full relative" style={{ height: 300 }}>
          <Image 
            source={{ uri: station.cover || "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?q=80&w=1000&auto=format&fit=crop" }} 
            className="w-full h-full absolute" 
            resizeMode="cover" 
          />
          <LinearGradient
            colors={colorScheme === 'dark' 
              ? ['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.2)', '#0a0a0a'] 
              : ['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.2)', 'hsl(0, 0%, 96%)']}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />
          
          {/* Header Controls */}
          <View style={{ marginTop: insets.top + 10 }} className="flex-row items-center justify-between px-4">
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-11 h-11 rounded-full bg-[#1a1a1a]/60 items-center justify-center backdrop-blur-md"
              >
                <ChevronLeft size={24} color="#fff" />
              </TouchableOpacity>
              <View className="w-11 h-11 rounded-full bg-[#1a1a1a]/60 items-center justify-center backdrop-blur-md">
                <Image source={{ uri: beepLogoBase64 }} style={{ width: 22, height: 22 }} resizeMode="contain" />
              </View>
            </View>
            
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                onPress={() => setIsFavorite(!isFavorite)}
                className="w-11 h-11 rounded-full bg-[#1a1a1a]/60 items-center justify-center backdrop-blur-md"
              >
                <Heart size={22} color={isFavorite ? "#ffcc00" : "#fff"} fill={isFavorite ? "#ffcc00" : "transparent"} />
              </TouchableOpacity>
              <TouchableOpacity className="w-11 h-11 rounded-full bg-[#1a1a1a]/60 items-center justify-center backdrop-blur-md">
                <ExternalLink size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Station Badge Overlay */}
          <Animated.View entering={FadeInDown.delay(200)} className="absolute -bottom-6 left-5 w-[85px] h-[85px] rounded-2xl bg-[#1a1a1a] flex-col items-center justify-center shadow-xl" style={{ borderWidth: 3, borderColor: '#fff', elevation: 8 }}>
            {isTV ? (
              <>
                <Tv size={26} color="#ffcc00" />
                <Text className="text-[11px] font-bold text-white mt-1.5">{station.freq}</Text>
              </>
            ) : (
              <>
                <Text className="text-2xl font-extrabold text-white leading-none">
                  {station.freq.replace(" FM", "")}
                </Text>
                <Text className="text-[10px] font-bold text-[#ffcc00] mt-0.5">FM</Text>
              </>
            )}
          </Animated.View>
        </View>

        {/* Station Info */}
        <Animated.View entering={FadeInDown.delay(300)} className="px-5 pt-6 pb-4">
          <View className="flex-row flex-wrap items-start justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-3xl font-extrabold text-foreground tracking-tight">{station.name}</Text>
              <View className="flex-row items-center gap-2 mt-1.5">
                <View className="flex-row gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={15} color="#d97706" fill={s <= Math.floor(station.rating || 0) ? "#f59e0b" : "transparent"} />
                  ))}
                </View>
                <Text className="text-[13px] text-muted-foreground font-medium">{station.rating} ({station.reviews || 1520} avaliações)</Text>
              </View>
            </View>
            <View className="flex-row items-center gap-1.5 bg-[#dcfce7] dark:bg-green-500/20 rounded-full px-3 py-1.5 mt-2">
              <View className="w-2 h-2 rounded-full bg-green-500" />
              <Text className="text-xs font-bold text-green-700 dark:text-green-500">AO VIVO</Text>
            </View>
          </View>

          {/* Contact info */}
          <View className="mt-6 gap-3">
            {station.location && (
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-xl bg-card-dark-foreground/5 items-center justify-center border border-card-dark-foreground/10">
                  <MapPin size={16} color="#666" />
                </View>
                <Text className="text-sm text-muted-foreground flex-1">{station.location}</Text>
              </View>
            )}
            {station.phone && (
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-xl bg-card-dark-foreground/5 items-center justify-center border border-card-dark-foreground/10">
                  <Phone size={16} color="#666" />
                </View>
                <Text className="text-sm font-semibold text-foreground flex-1">{station.phone}</Text>
              </View>
            )}
            {station.website && (
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-xl bg-card-dark-foreground/5 items-center justify-center border border-card-dark-foreground/10">
                  <Globe size={16} color="#666" />
                </View>
                <Text className="text-sm font-bold text-primary flex-1">{station.website}</Text>
              </View>
            )}
          </View>

          {/* Stats */}
          <View className="flex-row justify-between gap-3 mt-8">
            {stats.map((stat, i) => (
              <Animated.View key={stat.label} entering={FadeInDown.delay(400 + i * 100)} className="flex-1 bg-card rounded-2xl p-4 items-center border border-border shadow-sm">
                <stat.icon size={22} color="#ffcc00" className="mb-2" />
                <Text className="text-lg font-black text-foreground">{stat.value}</Text>
                <Text className="text-[11px] text-muted-foreground mt-1 text-center">{stat.label}</Text>
              </Animated.View>
            ))}
          </View>

          {/* Quick Actions Scroll */}
          <View className="mt-6">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 20 }}>
              {[
                { icon: Gift, label: "Promoções" },
                { icon: Headphones, label: isTV ? "Replay" : "Podcasts" },
                { icon: Music, label: "Playlist" },
              ].map((tag, i) => (
                <TouchableOpacity key={tag.label} className="flex-row items-center gap-2 px-5 py-3 rounded-2xl bg-card border border-border">
                  <tag.icon size={18} color="#ffcc00" />
                  <Text className="text-sm font-bold text-foreground">{tag.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Animated.View>

        {/* Programs Section */}
        <Animated.View entering={FadeInDown.delay(600)} className="px-5 mt-2">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-foreground">Programação</Text>
            <TouchableOpacity>
              <Text className="text-xs font-bold text-primary">Ver tudo</Text>
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View className="relative mb-4 flex-row items-center bg-card border border-border rounded-2xl px-4 py-3">
            <Search size={18} color="#666" />
            <TextInput
              placeholder="Buscar programa..."
              placeholderTextColor="#999"
              className="flex-1 ml-3 text-sm text-foreground"
            />
          </View>

          {/* Categories */}
          <View className="mb-5">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 20 }}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setActiveCategory(cat)}
                  className={`px-5 py-2.5 rounded-full border ${
                    activeCategory === cat
                      ? "bg-primary border-primary"
                      : "bg-card border-border"
                  }`}
                >
                  <Text className={`text-sm font-bold ${activeCategory === cat ? "text-primary-foreground" : "text-muted-foreground"}`}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Program List */}
          <View className="gap-3">
            {programs.map((prog, i) => (
              <Animated.View key={prog.name} entering={FadeInDown.delay(700 + i * 100)}>
                <TouchableOpacity className="flex-row items-center gap-4 p-4 bg-card rounded-2xl border border-border shadow-sm">
                  <View className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                    {isTV ? <Tv size={22} color="#ffcc00" /> : <Mic size={22} color="#ffcc00" />}
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-base font-bold text-foreground" numberOfLines={1}>{prog.name}</Text>
                      {prog.live && (
                        <View className="bg-green-500/15 px-2 py-0.5 rounded-full">
                          <Text className="text-[10px] font-black text-green-600">LIVE</Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-row items-center gap-1.5 mt-1.5">
                      <Clock size={12} color="#666" />
                      <Text className="text-xs text-muted-foreground">{prog.time}</Text>
                      <Text className="text-xs text-muted-foreground">• {prog.host}</Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color="#999" />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

      </ScrollView>
    </View>
  );
}
