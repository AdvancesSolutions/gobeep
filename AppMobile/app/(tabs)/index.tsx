import React, { useRef, useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown, SlideInRight, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, Easing, withSpring } from 'react-native-reanimated';
import { Bell, TrendingUp, Zap, BarChart3, Send, QrCode, Radio, User, Tv, Music, ChevronDown, Trophy, Gamepad2, Podcast, Star, Activity, MessageCircle, Gift, CheckCircle } from 'lucide-react-native';
import { beepLogoBase64 } from '../../constants/logos';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageHeader } from '../../components/PageHeader';
import { usePoints } from '../../contexts/PointsContext';
import * as Haptics from 'expo-haptics';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { io } from 'socket.io-client';
import Constants from 'expo-constants';

const hostIp = Constants.expoConfig?.hostUri?.split(':')[0] || '10.0.2.2';
const socket = io(`http://${hostIp}:3002`);

const { width } = Dimensions.get('window');

const BlurredOrb = ({ size, color, opacity }: { size: number, color: string, opacity: number }) => (
  <View style={{ width: size, height: size }}>
    <Svg height="100%" width="100%">
      <Defs>
        <RadialGradient id="grad" cx="50%" cy="50%" rx="50%" ry="50%" fx="50%" fy="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
          <Stop offset="50%" stopColor={color} stopOpacity={opacity * 0.5} />
          <Stop offset="100%" stopColor={color} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad)" />
    </Svg>
  </View>
);

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const quickActions = [
  { label: "Ao Vivo", icon: Zap, action: "/recognition" },
  { label: "Histórico", icon: BarChart3, action: "/history" },
  { label: "Emissoras", icon: Send, action: "/stationprofile" },
  { label: "Ranking", icon: Trophy, action: "/ranking" },
];

const stations = [
  { id: "cidade", name: "Rádio Cidade FM", freq: "98.5 FM", icon: Radio },
  { id: "globo", name: "TV Globo", freq: "Canal 5", icon: Tv },
  { id: "band", name: "Band FM", freq: "96.1 FM", icon: Radio },
];

const sessions = [
  { id: 1, stationId: "cidade", station: "Rádio Cidade FM", type: "radio", freq: "98.5 FM", tracks: 12, timeAgo: "20min atrás" },
  { id: 2, stationId: "globo", station: "TV Globo", type: "tv", freq: "Canal 5", tracks: 18, timeAgo: "1h atrás" },
  { id: 3, stationId: "band", station: "Band FM", type: "radio", freq: "96.1 FM", tracks: 15, timeAgo: "1 dia atrás" },
];

const mockSuggestions = [
  { id: "1", type: "programa", title: "Cine BEEP", description: "Avalie filmes em cartaz", emoji: "🍿", points: 35, duration: "agora", badge: "NOVO" },
  { id: "2", type: "quiz", title: "Quiz: Cinéfilo", description: "Reconheça o filme", emoji: "🎬", points: 60, duration: "quiz" },
  { id: "3", type: "desafio", title: "Desafio Diário", description: "Cumpra tarefas hoje", emoji: "⭐", points: 10, duration: "desafio", badge: "DIÁRIO" },
];

const typeConfig: Record<string, { icon: typeof Zap; color: string; bgClass: string }> = {
  programa: { icon: Tv, color: "#ffcc00", bgClass: "bg-primary/15" },
  quiz: { icon: Gamepad2, color: "#d99b00", bgClass: "bg-accent/15" },
  playlist: { icon: Music, color: "#ffcc00", bgClass: "bg-primary/15" },
  desafio: { icon: Star, color: "#ef4444", bgClass: "bg-destructive/15" },
  podcast: { icon: Podcast, color: "#ffcc00", bgClass: "bg-primary/15" },
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { totalPoints, addPoints } = usePoints();
  const scrollY = useSharedValue(0);

  // Daily Quests State
  const [quests, setQuests] = useState([
    { id: 1, title: 'Identificar uma TV ao vivo', icon: Tv, completed: false },
    { id: 2, title: 'Transferir Beepix para amigo', icon: Send, completed: false },
    { id: 3, title: 'Enviar um Buzz na rádio', icon: Zap, completed: false },
  ]);
  const [chestOpened, setChestOpened] = useState(false);
  const completedQuests = quests.filter(q => q.completed).length;
  const chestUnlocked = completedQuests === quests.length && !chestOpened;

  const handleQuestClick = (id: number) => {
    setQuests(prev => prev.map(q => q.id === id ? { ...q, completed: true } : q));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleOpenChest = () => {
    if (chestUnlocked) {
      setChestOpened(true);
      addPoints(500, "Baú Diário de Missões");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const handleSendReaction = (emoji: string) => {
    socket.emit('send_reaction', emoji);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const stickyHeaderStyle = useAnimatedStyle(() => {
    const isCollapsed = scrollY.value > 60;
    return {
      transform: [{ translateY: withSpring(isCollapsed ? 0 : -100, { damping: 20 }) }],
      opacity: withTiming(isCollapsed ? 1 : 0),
      marginBottom: isCollapsed ? 0 : -48,
    };
  });

  const [userName, setUserName] = useState("Usuário");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  
  // Interatividade de Segunda Tela
  const [activePoll, setActivePoll] = useState<any>(null);
  const [votedOption, setVotedOption] = useState<string | null>(null);
  const [activePromo, setActivePromo] = useState<any>(null);
  
  const gradientAnim = useSharedValue(0);

  React.useEffect(() => {
    // Escutar eventos de Segunda Tela
    socket.on('new_poll', (pollData) => {
      setActivePoll(pollData);
      setVotedOption(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });

    socket.on('new_promo', (promoData) => {
      setActivePromo(promoData);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });

    return () => {
      socket.off('new_poll');
      socket.off('new_promo');
    };
  }, []);

  React.useEffect(() => {
    gradientAnim.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    
    // Carregar dados do usuário
    const loadUserData = async () => {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const name = await AsyncStorage.getItem('beep_user_name');
      if (name) setUserName(name);
      
      let avatar = await AsyncStorage.getItem('beep_avatar');
      if (avatar) {
        if (avatar.includes('/svg?')) {
          avatar = avatar.replace('/svg?', '/png?');
          await AsyncStorage.setItem('beep_avatar', avatar);
        }
        setAvatarUri(avatar);
      }
    };
    loadUserData();
  }, [gradientAnim]);

  const scrollViewRef = useRef<any>(null);

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleBellPress = () => {
    Alert.alert("Notificações", "Nenhuma nova notificação no momento.");
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'hsl(0, 0%, 96%)' }} className="dark:bg-[#0a0a0a]">
      <Animated.ScrollView
        ref={scrollViewRef}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header Area (Dark Card) */}
        <View className="bg-card-dark pb-6 pt-16 px-5 overflow-hidden" style={{ paddingTop: insets.top + 20, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}>
          <View className="flex-row items-center justify-between mb-8">
            {/* Left side */}
            <View>
              <View className="flex-row items-center gap-3">
                <Image source={{ uri: beepLogoBase64 }} style={{ width: 44, height: 44 }} resizeMode="contain" />
                <View className="bg-[#ffcc00]/15 px-2.5 py-1 rounded-full border border-[#ffcc00]/10">
                  <Text className="text-[10px] font-bold text-[#ffcc00] tracking-wider">REDE BEEP</Text>
                </View>
              </View>
              <Text className="text-[15px] font-bold text-card-dark-foreground/80 mt-2">
                Boa tarde, {userName} 👋
              </Text>
            </View>

            {/* Right side */}
            <View className="flex-row items-center gap-2">
              <View className="flex-row items-center gap-1.5 bg-[#ffcc00]/15 px-3 py-2 rounded-full border border-[#ffcc00]/10">
                <Trophy size={14} color="#ffcc00" />
                <Text className="text-xs font-black text-[#ffcc00]">
                  {totalPoints} <Text className="text-[10px] font-normal opacity-70">pts</Text>
                </Text>
              </View>
              
              <TouchableOpacity onPress={handleBellPress} className="w-10 h-10 rounded-full bg-card-dark-foreground/10 items-center justify-center">
                <View className="absolute -top-1 -right-1 bg-[#ffcc00] rounded-full min-w-[18px] h-[18px] items-center justify-center z-10 px-1 border-2 border-[#1c1c1e]">
                  <Text className="text-[10px] font-bold text-black">3</Text>
                </View>
                <Bell size={18} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push('/tv-chat')} className="w-10 h-10 rounded-full bg-card-dark-foreground/10 items-center justify-center">
                <MessageCircle size={18} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push('/profile')} className="w-10 h-10 rounded-full bg-card-dark-foreground/10 items-center justify-center overflow-hidden">
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} className="w-full h-full" />
                ) : (
                  <User size={18} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Animated glow orbs - very soft/blur */}
          <Animated.View pointerEvents="none" entering={FadeIn.duration(1200)} className="absolute top-0 right-0 -translate-y-16 translate-x-12">
            <BlurredOrb size={220} color="#ffcc00" opacity={0.04} />
          </Animated.View>
          <Animated.View pointerEvents="none" entering={FadeIn.duration(1200).delay(200)} className="absolute bottom-0 left-0 translate-y-12 -translate-x-12">
            <BlurredOrb size={180} color="#ffcc00" opacity={0.03} />
          </Animated.View>

          <View>

            {/* Main Balance Card */}
            <Animated.View entering={FadeInDown.delay(300).springify()} className="bg-card-dark-foreground/5 border border-card-dark-foreground/15 rounded-2xl p-4 mb-2 overflow-hidden">
              <View className="flex-row items-start justify-between">
                <View>
                  <Text className="text-xs font-semibold text-card-dark-foreground/60">Sessões este mês</Text>
                  <Text className="text-[35px] font-extrabold text-card-dark-foreground mt-1 tracking-tight">47</Text>
                  <Text className="text-[11px] text-card-dark-foreground/55 mt-1">8 sessões a mais que no mês anterior</Text>
                </View>
                <Animated.View entering={FadeIn.delay(800).springify()} className="flex-row items-center gap-1.5 bg-primary/20 rounded-full px-2.5 py-1">
                  <TrendingUp size={11} color="#ffcc00" />
                  <Text className="text-[10px] font-bold text-primary">+14.8%</Text>
                </Animated.View>
              </View>

              <View className="flex-row justify-between mt-4">
                {[
                  { icon: Music, value: "312", label: "faixas" },
                  { icon: Radio, value: "8", label: "rádios" },
                  { icon: Tv, value: "4", label: "TVs" },
                ].map((item, i) => (
                  <Animated.View key={item.label} entering={FadeInDown.delay(550 + i * 80).springify()} className="flex-1 mx-1 rounded-xl bg-card-dark-foreground/10 border border-card-dark-foreground/10 py-2 items-center">
                    <item.icon size={12} color="#ffcc00" className="mb-1" />
                    <Text className="text-sm font-bold text-card-dark-foreground">{item.value}</Text>
                    <Text className="text-[10px] text-card-dark-foreground/60 mt-0.5">{item.label}</Text>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>

            {/* Quick Actions */}
            <View className="flex-row justify-between mt-5">
              {quickActions.map((action, i) => (
                <Animated.View key={action.label} entering={FadeInDown.delay(400 + i * 80).springify()}>
                  <TouchableOpacity onPress={() => router.push(action.action as never)} className="items-center gap-1.5">
                    <View className="w-12 h-12 rounded-2xl bg-card-dark-foreground/10 items-center justify-center">
                      <action.icon size={20} color="rgba(255,255,255,0.8)" />
                    </View>
                    <Text className="text-[11px] font-medium text-card-dark-foreground/60">{action.label}</Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>

            {/* Credits / Pro Card */}
            <Animated.View entering={FadeInDown.delay(500).springify()} className="mt-5 bg-card-dark-foreground/5 border border-card-dark-foreground/10 rounded-2xl p-4 overflow-hidden">
              <Animated.View entering={FadeIn.delay(500)} className="w-full h-24 rounded-xl mb-3 overflow-hidden">
                <LinearGradient colors={['rgba(255,204,0,0.8)', 'rgba(255,204,0,0.4)', 'rgba(217,155,0,0.6)']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                <View className="absolute top-2.5 left-3 flex-row items-center gap-1.5">
                  <Image source={{ uri: beepLogoBase64 }} style={{ width: 16, height: 16, tintColor: 'rgba(255,255,255,0.8)' }} resizeMode="contain" />
                  <Text className="text-[9px] text-white/70">Pro</Text>
                </View>
                <View className="absolute bottom-2.5 left-3 flex-row items-center gap-6">
                  <Text className="text-[11px] font-mono text-white tracking-widest">•••• 4821</Text>
                  <Text className="text-[10px] font-medium text-white/70">03/27</Text>
                </View>
                <View className="absolute top-2.5 right-3 flex-row items-center">
                  <View className="w-5 h-5 rounded-full bg-red-500/80 -mr-2 z-10" />
                  <View className="w-5 h-5 rounded-full bg-[#ffcc00]/80" />
                </View>
              </Animated.View>

              <View className="flex-row items-center justify-between mb-3">
                <View>
                  <Text className="text-[10px] font-medium text-card-dark-foreground/40 uppercase tracking-wider">Créditos</Text>
                  <Text className="text-xl font-extrabold text-card-dark-foreground tracking-tight">R$ 596,00</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity className="w-7 h-7 rounded-lg bg-card-dark-foreground/10 items-center justify-center">
                    <BarChart3 size={12} color="rgba(255,255,255,0.5)" />
                  </TouchableOpacity>
                  <TouchableOpacity className="w-7 h-7 rounded-lg bg-card-dark-foreground/10 items-center justify-center">
                    <Send size={12} color="rgba(255,255,255,0.5)" />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="gap-2.5">
                <View>
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-[10px] text-card-dark-foreground/40 font-medium">Uso de reconhecimento</Text>
                    <Text className="text-[10px] font-semibold text-card-dark-foreground/60">105 / 200</Text>
                  </View>
                  <View className="h-1.5 bg-card-dark-foreground/10 rounded-full overflow-hidden">
                    <View className="h-full w-[52%] bg-primary rounded-full" />
                  </View>
                </View>
                <View>
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-[10px] text-card-dark-foreground/40 font-medium">Limite do plano</Text>
                    <Text className="text-[10px] font-semibold text-card-dark-foreground/60">890 / 1000</Text>
                  </View>
                  <View className="h-1.5 bg-card-dark-foreground/10 rounded-full overflow-hidden">
                    <LinearGradient colors={['#ffcc00', '#ef4444']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: '89%', height: '100%', borderRadius: 999 }} />
                  </View>
                </View>
              </View>

              <View className="mt-3 py-2 px-3 bg-card-dark-foreground/5 rounded-xl flex-row items-center justify-between">
                <Text className="text-[10px] text-card-dark-foreground/40">Próx. renovação em Abril: <Text className="text-card-dark-foreground/70 font-semibold">R$ 119</Text></Text>
                <View className="w-4 h-4 rounded-full border border-card-dark-foreground/20 items-center justify-center">
                  <Text className="text-[8px] text-card-dark-foreground/40">?</Text>
                </View>
              </View>
            </Animated.View>
          </View>
        </View>

        {/* Interatividade de Segunda Tela (Live Polling & Promos) */}
        {(activePoll || activePromo) && (
          <Animated.View entering={FadeInDown.delay(200)} className="px-5 mt-6 mb-2">
            
            {activePromo && (
              <View className="bg-purple-600 rounded-3xl p-5 mb-4 shadow-lg border border-purple-400/30">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-2">
                    <Send size={20} color="#fff" />
                    <Text className="font-bold text-white text-base">Oferta na TV!</Text>
                  </View>
                  <TouchableOpacity onPress={() => setActivePromo(null)}>
                    <Text className="text-white/60 font-bold text-xs">FECHAR</Text>
                  </TouchableOpacity>
                </View>
                <Text className="text-2xl font-black text-white mb-1">{activePromo.title}</Text>
                <Text className="text-white/80 mb-4 text-sm">{activePromo.description}</Text>
                <TouchableOpacity 
                  className="bg-white py-3 rounded-xl items-center"
                  onPress={() => {
                    socket.emit('promo_click', {
                      userName: userName,
                      userEmail: "appuser@beep.app",
                      promoTitle: activePromo.title
                    });
                    setActivePromo(null);
                    alert(`Redirecionando para: ${activePromo.link}`);
                  }}
                >
                  <Text className="text-purple-600 font-bold">Aproveitar Oferta</Text>
                </TouchableOpacity>
              </View>
            )}

            {activePoll && (
              <View className="bg-green-600 rounded-3xl p-5 shadow-lg border border-green-400/30">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-2">
                    <Activity size={20} color="#fff" />
                    <Text className="font-bold text-white text-base">Enquete ao Vivo</Text>
                  </View>
                  <View className="bg-black/20 px-2 py-1 rounded-full animate-pulse">
                    <Text className="text-white font-bold text-[10px] uppercase tracking-wider">AO VIVO</Text>
                  </View>
                </View>
                
                <Text className="text-xl font-bold text-white mb-4 leading-tight">{activePoll.question}</Text>
                
                <View className="gap-2">
                  {activePoll.options.map((option: string, idx: number) => {
                    const isSelected = votedOption === option;
                    return (
                      <TouchableOpacity 
                        key={idx}
                        disabled={!!votedOption}
                        onPress={() => {
                          setVotedOption(option);
                          socket.emit('poll_vote', { pollId: activePoll.id, option });
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        }}
                        className={`py-3 px-4 rounded-xl flex-row items-center justify-between border ${isSelected ? 'bg-white border-white' : 'bg-black/10 border-white/20'}`}
                      >
                        <Text className={`font-bold ${isSelected ? 'text-green-600' : 'text-white'}`}>{option}</Text>
                        {isSelected && <Trophy size={16} color="#16a34a" />}
                      </TouchableOpacity>
                    )
                  })}
                </View>
                
                {votedOption && (
                  <Animated.Text entering={FadeIn.delay(300)} className="text-white/80 text-xs text-center mt-4 font-medium">
                    Voto registrado! Olhe para a TV para ver o resultado parcial.
                  </Animated.Text>
                )}
              </View>
            )}
          </Animated.View>
        )}

        {/* Favorite Stations */}
        <Animated.View entering={FadeInDown.delay(600)} className="px-5 mt-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <View className="w-1.5 h-1.5 rounded-full bg-primary" />
              <Text className="font-bold text-sm text-foreground">Rádio & TV Favoritos</Text>
            </View>
            <TouchableOpacity>
              <Text className="text-xs font-semibold text-primary">Ver todas</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row flex-wrap gap-3">
            {stations.map((station, i) => (
              <Animated.View key={station.id} entering={FadeInDown.delay(500 + i * 100)} className="w-[31%]">
                <TouchableOpacity onPress={() => router.push({ pathname: '/stationprofile', params: { stationId: station.id } })} className="w-full flex-col items-center gap-2 p-3 bg-card rounded-2xl border border-border">
                  <View className="w-10 h-10 rounded-xl bg-primary/15 items-center justify-center">
                    <station.icon size={20} color="#ffcc00" />
                  </View>
                  <View className="items-center w-full">
                    <Text className="text-[11px] font-semibold text-foreground text-center" numberOfLines={1} adjustsFontSizeToFit>{station.name}</Text>
                    <Text className="text-[9px] text-muted-foreground text-center">{station.freq}</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Latest Sessions */}
        <Animated.View entering={FadeInDown.delay(700)} className="px-5 mt-6">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <View className="w-1.5 h-1.5 rounded-full bg-primary" />
              <Text className="font-bold text-sm text-foreground">Sessões Recentes</Text>
            </View>
            <TouchableOpacity>
              <Text className="text-xs font-semibold text-primary">Ver tudo</Text>
            </TouchableOpacity>
          </View>

          <View className="gap-3">
            {sessions.map((session) => {
              const stationData = stations.find(s => s.id === session.stationId);
              const Icon = stationData?.icon || Radio;
              return (
                <View key={session.id} className="flex-row items-center gap-2 p-3 bg-card rounded-2xl border border-border">
                  <TouchableOpacity onPress={() => router.push({ pathname: '/detail', params: { sessionId: session.id } })} className="flex-1 flex-row items-center gap-3">
                    <View className="w-11 h-11 rounded-xl bg-muted items-center justify-center">
                      <Icon size={20} color="#ffcc00" />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-1.5">
                        <Text className="font-semibold text-sm text-foreground">{session.station}</Text>
                        <View className={`px-1.5 py-0.5 rounded-full ${session.type === 'tv' ? 'bg-accent/15' : 'bg-primary/15'}`}>
                          <Text className={`text-[9px] font-bold uppercase ${session.type === 'tv' ? 'text-accent' : 'text-primary'}`}>
                            {session.type === 'tv' ? 'TV' : 'Rádio'}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-xs text-muted-foreground mt-0.5">{session.freq}</Text>
                    </View>
                    <View className="items-end mr-2">
                      <Text className="text-sm font-bold text-foreground">{session.tracks} pts</Text>
                      <Text className="text-[11px] text-muted-foreground mt-0.5">{session.timeAgo}</Text>
                    </View>
                  </TouchableOpacity>
                  
                  {/* Chat Shortcut */}
                  <TouchableOpacity 
                    onPress={() => router.push({ pathname: '/chat/[stationId]', params: { stationId: session.stationId } })}
                    className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center ml-auto border border-primary/30"
                  >
                    <MessageCircle size={18} color="#ffcc00" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* Insight Card */}
          <View className="mt-5 mb-4 p-4 bg-primary/10 border border-primary/15 rounded-2xl flex-row items-start gap-3">
            <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mt-0.5">
              <TrendingUp size={16} color="#ffcc00" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-foreground">Suas sessões aumentaram 23% esta semana!</Text>
              <TouchableOpacity className="mt-1">
                <Text className="text-[11px] text-primary font-semibold">Veja o que você pode descobrir ainda mais →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Para Você */}
        <Animated.View entering={FadeInDown.delay(800)} className="px-5 mt-6">
          <View className="flex-row items-center justify-between mb-4 mt-2">
            <View className="flex-row items-center gap-2">
              <Star fill="#ffcc00" color="#ffcc00" size={18} />
              <Text className="font-black text-lg text-foreground">Missões Diárias</Text>
            </View>
            <Text className="text-sm font-bold text-muted-foreground">{completedQuests}/{quests.length}</Text>
          </View>

          {/* Baú de Recompensas */}
          <TouchableOpacity 
            onPress={handleOpenChest}
            disabled={!chestUnlocked}
            className={`w-full h-32 rounded-3xl items-center justify-center mb-6 overflow-hidden border ${chestOpened ? 'bg-primary/20 border-primary/50' : chestUnlocked ? 'bg-amber-100 border-amber-400' : 'bg-card border-border/50'}`}
          >
            {chestUnlocked && !chestOpened && (
              <Animated.View style={{ position: 'absolute', width: '100%', height: '100%' }} entering={FadeIn}>
                <LinearGradient colors={['#fde047', '#fbbf24', '#f59e0b']} className="w-full h-full opacity-30 absolute" />
              </Animated.View>
            )}
            <Animated.View 
              entering={chestUnlocked ? FadeInDown.springify() : undefined}
              className={`items-center justify-center w-16 h-16 rounded-2xl mb-2 ${chestOpened ? 'bg-green-500/20' : chestUnlocked ? 'bg-white shadow-lg' : 'bg-muted'}`}
            >
              {chestOpened ? (
                <CheckCircle size={32} color="#22c55e" />
              ) : (
                <Gift size={32} color={chestUnlocked ? '#d97706' : '#888'} />
              )}
            </Animated.View>
            <Text className={`text-sm font-black ${chestOpened ? 'text-green-500' : chestUnlocked ? 'text-amber-700' : 'text-muted-foreground'}`}>
              {chestOpened ? '+500 Bips Resgatados!' : chestUnlocked ? 'TOCAR PARA ABRIR O BAÚ!' : 'Complete missões para abrir'}
            </Text>
          </TouchableOpacity>

          <View className="gap-3">
            {quests.map((quest, index) => {
              const Icon = quest.icon;
              return (
                <TouchableOpacity 
                  key={quest.id} 
                  onPress={() => handleQuestClick(quest.id)}
                  disabled={quest.completed}
                  className={`w-full flex-row items-center p-4 rounded-2xl border ${quest.completed ? 'bg-primary/10 border-primary/30' : 'bg-card border-border'}`}
                >
                  <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${quest.completed ? 'bg-primary/20' : 'bg-muted'}`}>
                    {quest.completed ? <CheckCircle size={20} color="#ffcc00" /> : <Icon size={20} color="#888" />}
                  </View>
                  <View className="flex-1">
                    <Text className={`font-bold text-base ${quest.completed ? 'text-foreground line-through opacity-70' : 'text-foreground'}`}>
                      {quest.title}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* TESTE DE NOTIFICAÇÕES */}
          <View className="mt-8 mb-6 p-5 bg-card rounded-3xl border border-border">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2">
                <Bell size={20} color="#ffcc00" />
                <Text className="text-lg font-bold text-foreground">Teste de Alertas</Text>
              </View>
              <View className="bg-primary/10 px-2 py-1 rounded-full">
                <Text className="text-[10px] font-bold text-primary uppercase">Módulo 3</Text>
              </View>
            </View>
            <Text className="text-sm text-muted-foreground mb-4">
              Ao clicar abaixo, feche o aplicativo (minimize). A notificação chegará em 5 segundos no sistema operacional!
            </Text>
            <View className="gap-2">
              <TouchableOpacity 
                onPress={() => {
                  import('../../src/utils/notifications').then(m => 
                    m.scheduleNotification('O Fantástico Começou! 📺', 'Abra o app, reconheça a TV e ganhe 50 pontos!', 5)
                  );
                }}
                className="w-full bg-[#ffcc00]/20 py-3 rounded-xl items-center border border-[#ffcc00]/30"
              >
                <Text className="text-[#ffcc00] font-bold">🔔 Simular Programa de TV</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => {
                  import('../../src/utils/notifications').then(m => 
                    m.scheduleNotification('Oferta Relâmpago Magalu! 🛒', 'Reconheça a propaganda que está passando agora!', 5)
                  );
                }}
                className="w-full bg-[#ffcc00]/20 py-3 rounded-xl items-center border border-[#ffcc00]/30"
              >
                <Text className="text-[#ffcc00] font-bold">🔔 Simular Oferta Patrocinada</Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* FIM TESTE NOTIFICACOES */}

          {/* ACESSO B2B - ANUNCIANTE */}
          <View className="mb-8 p-5 bg-card-dark rounded-3xl border border-border">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2">
                <BarChart3 size={20} color="#3b82f6" />
                <Text className="text-lg font-bold text-white">Área B2B</Text>
              </View>
              <View className="bg-primary/20 px-2 py-1 rounded-full">
                <Text className="text-[10px] font-bold text-primary uppercase">Módulo 2</Text>
              </View>
            </View>
            <Text className="text-sm text-card-dark-foreground/70 mb-4">
              Acesse a visão corporativa das marcas (Coca-Cola, Itaú) acompanhando o ROI e leads das campanhas em tempo real.
            </Text>
            <TouchableOpacity 
              onPress={() => router.push('/advertiser' as any)}
              className="w-full bg-primary py-3 rounded-xl items-center"
            >
              <Text className="text-black font-bold">🏢 Acessar Dashboard do Anunciante</Text>
            </TouchableOpacity>
          </View>
          {/* FIM B2B */}

        </Animated.View>
      </Animated.ScrollView>

      {/* Sticky mini-header - AFTER ScrollView so it captures touches! */}
      <Animated.View 
        className="bg-card-dark/95 border-b border-card-dark-foreground/10"
        style={[{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50, paddingTop: insets.top }, stickyHeaderStyle]}
      >
        <View className="px-4 py-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Image source={{ uri: beepLogoBase64 }} style={{ width: 24, height: 24 }} resizeMode="contain" />
            <View className="bg-primary/20 rounded-full px-1.5 py-0.5">
              <Text className="text-[10px] font-bold text-primary">R&TV</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity onPress={scrollToTop} className="w-8 h-8 rounded-full bg-card-dark-foreground/10 items-center justify-center">
              <ChevronDown size={14} color="#ffffff" style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleBellPress} className="w-8 h-8 rounded-full bg-card-dark-foreground/10 items-center justify-center">
              <Bell size={14} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
