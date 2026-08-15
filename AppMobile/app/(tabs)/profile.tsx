import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Image, Dimensions, Alert } from 'react-native';
import { 
  User, Camera, Trophy, ChevronRight, CheckCircle2, Bell, Eye, Smartphone, LayoutGrid, 
  Shield, Activity, Phone, Mail, Lock, Settings, LogOut, Radio, Tv, Star, Sliders, 
  AlertCircle, MessageSquare, Download, Sun, Moon, Volume2, ShieldCheck, MapPin, Search
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from 'nativewind';
import { usePoints } from '../../contexts/PointsContext';
import { useGamification } from '../../contexts/GamificationContext';
import { ACHIEVEMENTS } from '../../constants/achievements';
import { PageHeader } from '../../components/PageHeader';

const { width } = Dimensions.get('window');

const INTERESTS = [
  { id: "politica", label: "Política", emoji: "🏛️" },
  { id: "esportes", label: "Esportes", emoji: "⚽" },
  { id: "novelas", label: "Novelas", emoji: "📺" },
  { id: "musica", label: "Música", emoji: "🎵" },
  { id: "tecnologia", label: "Tecnologia", emoji: "💻" },
  { id: "humor", label: "Humor", emoji: "😂" },
  { id: "noticias", label: "Notícias", emoji: "📰" },
  { id: "cinema", label: "Cinema", emoji: "🎬" },
];

export default function ProfileScreen() {
  const { totalPoints } = usePoints();
  const { xp, level, nextLevelXp, unlockedAchievements } = useGamification();
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const [userName, setUserName] = useState("Alessandro");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>(['musica', 'tecnologia', 'humor', 'cinema']);

  const [toggles, setToggles] = useState({
    aoVivo: true,
    destaqueLocal: false,
    exclusivos: true,
    evitarSpoilers: false,
    push: true,
    email: false,
    sms: true,
    silenciar: false,
    nomePublico: true,
    fotoPerfil: true,
    pontuacao: true,
    gostosVisiveis: false,
    autenticacao2fa: false,
    marketing: true,
    personalizacao: true,
    dadosAnonimos: true,
    altoContraste: false,
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const savedName = await AsyncStorage.getItem("beep_user_name");
        if (savedName) setUserName(savedName);
        const savedAvatar = await AsyncStorage.getItem("beep_avatar");
        if (savedAvatar) setAvatar(savedAvatar);
      } catch (e) {}
    };
    loadProfile();
  }, []);

  const handleToggle = (key: keyof typeof toggles) => {
    Haptics.selectionAsync();
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleInterest = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInterests(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handlePickImage = async () => {
    Haptics.impactAsync();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setAvatar(uri);
      await AsyncStorage.setItem("beep_avatar", uri);
    }
  };

  const toggleTheme = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setColorScheme(isDark ? 'light' : 'dark');
  };

  const handleAction = (message: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Ação realizada", message);
  };

  // Components
  const SectionTitle = ({ title }: { title: string }) => (
    <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3 mt-8">{title}</Text>
  );

  const ToggleRow = ({ icon: Icon, title, desc, toggleKey }: any) => (
    <View className="flex-row items-center justify-between p-4 border-b border-border/50">
      <View className="flex-row items-center gap-3 flex-1 pr-4">
        <Icon size={20} color="#ffcc00" />
        <View>
          <Text className="font-bold text-foreground text-sm">{title}</Text>
          <Text className="text-[10px] text-muted-foreground mt-0.5">{desc}</Text>
        </View>
      </View>
      <Switch 
        value={toggles[toggleKey as keyof typeof toggles]} 
        onValueChange={() => handleToggle(toggleKey)} 
        trackColor={{ true: '#ffcc00', false: '#333' }} 
      />
    </View>
  );

  const SliderTrack = ({ value, color, label, rightLabel }: any) => (
    <View className="mb-4">
      <View className="flex-row justify-between mb-1.5">
        <Text className="text-xs font-bold text-foreground">{label}</Text>
        <Text className="text-[10px] font-bold" style={{ color }}>{rightLabel}</Text>
      </View>
      <View className="h-1.5 bg-muted rounded-full w-full overflow-hidden">
        <View className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* Dark Header Block */}
        <View className="bg-card-dark rounded-b-[40px] pb-8">
          <PageHeader title="Meu Perfil" totalPoints={totalPoints} showBack={true} isDark={true} />
          
          <Animated.View entering={FadeInDown.delay(100)} className="mt-8 px-5">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-4">
                <View className="relative">
                  <View className="w-16 h-16 rounded-2xl bg-primary/20 items-center justify-center overflow-hidden border-2 border-primary/30">
                    {avatar ? (
                      <Image source={{ uri: avatar }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                      <User size={28} color="#ffcc00" />
                    )}
                  </View>
                  <TouchableOpacity onPress={handlePickImage} className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-primary items-center justify-center border-2 border-card-dark">
                    <Camera size={12} color="#1c1c1e" />
                  </TouchableOpacity>
                </View>

                <View>
                  <Text className="text-xl font-black text-card-dark-foreground">{userName}</Text>
                  <View className="flex-row items-center gap-2 mt-1">
                    <View className="flex-row items-center gap-1 bg-primary/20 px-2 py-0.5 rounded-md">
                      <Trophy size={10} color="#ffcc00" />
                      <Text className="text-[10px] text-primary font-bold">Nível {level}</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Text className="text-[10px] text-muted-foreground font-bold">{totalPoints} Bips</Text>
                    </View>
                  </View>
                  <View className="mt-2 w-32">
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-[8px] text-muted-foreground font-bold uppercase">XP</Text>
                      <Text className="text-[8px] text-primary font-bold uppercase">{xp} / {nextLevelXp}</Text>
                    </View>
                    <View className="h-1 bg-card-dark-foreground/10 rounded-full overflow-hidden">
                      <View className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (xp / nextLevelXp) * 100)}%` }} />
                    </View>
                  </View>
                </View>
              </View>

              <TouchableOpacity className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-2">
                <Text className="text-primary font-bold text-xs">Editar</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-between gap-3 mt-8">
              <View className="flex-1 bg-card-dark-foreground/5 rounded-2xl p-4 items-center border border-card-dark-foreground/10">
                <Text className="text-2xl font-black text-card-dark-foreground">0</Text>
                <Text className="text-[10px] uppercase font-bold text-card-dark-foreground/50 tracking-wider mt-1">Avaliações</Text>
              </View>
              <View className="flex-1 bg-primary/10 rounded-2xl p-4 items-center border border-primary/20">
                <Text className="text-2xl font-black text-primary">0</Text>
                <Text className="text-[10px] uppercase font-bold text-primary/70 tracking-wider mt-1">Reconhecimentos</Text>
              </View>
              <View className="flex-1 bg-red-500/10 rounded-2xl p-4 items-center border border-red-500/20">
                <Text className="text-2xl font-black text-red-500">0</Text>
                <Text className="text-[10px] uppercase font-bold text-red-500/70 tracking-wider mt-1">Sessões</Text>
              </View>
            </View>
          </Animated.View>
        </View>

        <View className="px-5 gap-0">
          
          {/* Acesso Institucional */}
          <Animated.View entering={FadeInDown.delay(150)}>
            <SectionTitle title="Acesso Institucional" />
            
            <TouchableOpacity onPress={() => router.push('/(tabs)/bets')} className="bg-card border border-border rounded-2xl p-4 flex-row items-center justify-between shadow-sm mb-3">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
                  <Trophy size={20} color="#ffcc00" />
                </View>
                <View>
                  <Text className="font-bold text-base text-foreground">Criador de Apostas</Text>
                  <Text className="text-[10px] text-muted-foreground font-medium mt-0.5">Crie desafios e apostas para a comunidade.</Text>
                </View>
              </View>
              <ChevronRight size={20} color="#ffcc00" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/audio-director')} className="bg-[#f0e6d2] border border-[#e6d5b8] rounded-2xl p-4 flex-row items-center justify-between shadow-sm">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-xl bg-[#e6d5b8] items-center justify-center">
                  <Volume2 size={20} color="#b48600" />
                </View>
                <View>
                  <Text className="font-bold text-base text-[#5c4400]">Diretor de Áudio</Text>
                  <Text className="text-[10px] text-[#8c6b14] font-medium mt-0.5">Crie modelo de negócios para rádio e TV</Text>
                </View>
              </View>
              <ChevronRight size={20} color="#b48600" />
            </TouchableOpacity>
          </Animated.View>

          {/* Ações Rápidas */}
          <Animated.View entering={FadeInDown.delay(200)}>
            <SectionTitle title="Ações Rápidas" />
            <View className="flex-row flex-wrap justify-between gap-y-3">
              {[
                { icon: User, label: "Editar perfil" },
                { icon: MessageSquare, label: "Comunicação" },
                { icon: Shield, label: "Privacidade" },
                { icon: Smartphone, label: "Dispositivos" }
              ].map((item, i) => (
                <TouchableOpacity key={i} className="w-[48%] bg-card border border-border rounded-2xl p-4 items-center gap-2 shadow-sm">
                  <item.icon size={22} color="#ffcc00" />
                  <Text className="text-xs font-bold text-foreground text-center">{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Complete seu perfil */}
          <Animated.View entering={FadeInDown.delay(250)}>
            <SectionTitle title="Complete seu perfil" />
            <View className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-[11px] text-muted-foreground">Ganhe mais relevância nas recomendações.</Text>
                <Text className="font-black text-primary">100%</Text>
              </View>
              <View className="h-1.5 bg-muted rounded-full w-full overflow-hidden mt-2 mb-4">
                <View className="h-full rounded-full" style={{ width: '100%', backgroundColor: '#ffcc00' }} />
              </View>
              <View className="flex-row flex-wrap gap-y-3">
                {[
                  "Nome atualizado", "Foto adicionada", "Gostos escolhidos", "Preferências de comunicação"
                ].map((item, i) => (
                  <View key={i} className="w-1/2 flex-row items-center gap-2">
                    <CheckCircle2 size={14} color="#ffcc00" />
                    <Text className="text-[10px] font-bold text-foreground">{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* Histórico por Status */}
          <Animated.View entering={FadeInDown.delay(300)}>
            <View className="flex-row items-center justify-between mt-8 mb-3">
              <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Histórico por Status</Text>
              <TouchableOpacity><Text className="text-[10px] font-bold text-primary">VER TODAS</Text></TouchableOpacity>
            </View>
            <View className="bg-card border border-border rounded-2xl p-4 shadow-sm flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <Search size={14} color="#999" />
                <Text className="text-xs text-muted-foreground">Filtrar por emissora...</Text>
              </View>
            </View>
            <View className="bg-card border border-border rounded-2xl p-6 shadow-sm items-center justify-center border-dashed">
              <Trophy size={32} color="#e5e5e5" className="mb-2" />
              <Text className="text-sm font-bold text-foreground text-center">Você ainda não fez apostas.</Text>
              <TouchableOpacity className="mt-4 bg-primary px-5 py-2 rounded-xl">
                <Text className="font-bold text-card-dark text-xs">Começar agora</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Marcos e badges */}
          <Animated.View entering={FadeInDown.delay(350)}>
            <SectionTitle title="Conquistas" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {ACHIEVEMENTS.map((badge, i) => {
                const isUnlocked = unlockedAchievements.includes(badge.id);
                const Icon = badge.icon;
                return (
                  <View key={i} className={`bg-card border border-border rounded-2xl p-4 w-[140px] shadow-sm ${!isUnlocked ? 'opacity-50' : ''}`}>
                    <View className="w-8 h-8 rounded-full mb-3 items-center justify-center" style={{ backgroundColor: isUnlocked ? `${badge.color}20` : '#e5e5e5' }}>
                      <Icon size={16} color={isUnlocked ? badge.color : '#999'} />
                    </View>
                    <Text className="font-bold text-foreground text-sm mb-1">{badge.title}</Text>
                    <Text className="text-[9px] text-muted-foreground">{badge.description}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* Aparência */}
          <Animated.View entering={FadeInDown.delay(400)}>
            <SectionTitle title="Aparência" />
            <View className="flex-row bg-card border border-border rounded-2xl p-1 shadow-sm">
              <TouchableOpacity 
                onPress={toggleTheme} 
                className={`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl ${!isDark ? 'bg-background shadow-sm' : ''}`}
              >
                <Sun size={18} color={!isDark ? "#ffcc00" : "#999"} />
                <Text className={`font-bold text-xs ${!isDark ? 'text-foreground' : 'text-muted-foreground'}`}>Light</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={toggleTheme} 
                className={`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl ${isDark ? 'bg-background shadow-sm' : ''}`}
              >
                <Moon size={18} color={isDark ? "#ffcc00" : "#999"} />
                <Text className={`font-bold text-xs ${isDark ? 'text-foreground' : 'text-muted-foreground'}`}>Dark</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Meus Gostos */}
          <Animated.View entering={FadeInDown.delay(450)}>
            <SectionTitle title="Meus Gostos" />
            <View className="flex-row flex-wrap gap-2">
              {INTERESTS.map(item => {
                const isActive = interests.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => toggleInterest(item.id)}
                    className={`flex-row items-center gap-1.5 px-4 py-2.5 rounded-full border ${
                      isActive ? "bg-primary border-primary" : "bg-card border-border"
                    }`}
                  >
                    <Text className="text-sm">{item.emoji}</Text>
                    <Text className={`text-xs font-bold ${isActive ? "text-card-dark" : "text-muted-foreground"}`}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>

          {/* Preferências de conteúdo */}
          <Animated.View entering={FadeInDown.delay(500)}>
            <SectionTitle title="Preferências de conteúdo" />
            <View className="bg-card border border-border rounded-2xl shadow-sm p-5 mb-3">
              <Text className="text-xs font-bold text-foreground mb-3">Formatos preferidos</Text>
              <View className="flex-row gap-2 mb-6">
                {["Rádio", "TV", "Clipes", "Podcasts"].map((f,i) => (
                  <View key={i} className={`px-3 py-1.5 rounded-lg border ${i < 2 ? 'bg-primary/20 border-primary/30' : 'bg-muted border-border'}`}>
                    <Text className={`text-[10px] font-bold ${i < 2 ? 'text-primary' : 'text-muted-foreground'}`}>{f}</Text>
                  </View>
                ))}
              </View>

              <SliderTrack label="Novidades vs. conhecidos" rightLabel="60%" value={60} color="#ffcc00" />
              <SliderTrack label="Profundidade do conteúdo" rightLabel="50%" value={50} color="#3b82f6" />
              
              <Text className="text-xs font-bold text-foreground mt-2 mb-3">Frequência de recomendações</Text>
              <View className="flex-row gap-2">
                <View className="flex-1 bg-muted py-2 rounded-lg items-center"><Text className="text-[10px] font-bold text-muted-foreground">Baixa</Text></View>
                <View className="flex-1 bg-primary py-2 rounded-lg items-center"><Text className="text-[10px] font-bold text-card-dark">Média</Text></View>
                <View className="flex-1 bg-muted py-2 rounded-lg items-center"><Text className="text-[10px] font-bold text-muted-foreground">Alta</Text></View>
              </View>
            </View>

            <View className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <ToggleRow icon={Activity} title="Priorizar conteúdo ao vivo" desc="Emissoras no ar." toggleKey="aoVivo" />
              <ToggleRow icon={MapPin} title="Dar destaque ao conteúdo local" desc="Com base no GPS." toggleKey="destaqueLocal" />
              <ToggleRow icon={Star} title="Exclusivos e bastidores" desc="Conteúdo Vip." toggleKey="exclusivos" />
              <ToggleRow icon={Eye} title="Evitar spoilers" desc="Ocultar fofocas recentes." toggleKey="evitarSpoilers" />
            </View>
          </Animated.View>

          {/* Preferências de comunicação */}
          <Animated.View entering={FadeInDown.delay(550)}>
            <SectionTitle title="Preferências de comunicação" />
            <View className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden mb-3">
              <ToggleRow icon={Bell} title="Push no app" desc="Alertas em tempo real." toggleKey="push" />
              <ToggleRow icon={Mail} title="E-mail" desc="Relatórios e novidades." toggleKey="email" />
              <ToggleRow icon={Smartphone} title="SMS" desc="Alertas críticos." toggleKey="sms" />
              <ToggleRow icon={Moon} title="Silenciar em horário" desc="Evite notificações tarde da noite." toggleKey="silenciar" />
            </View>
            {toggles.silenciar && (
              <View className="flex-row gap-3">
                <View className="flex-1 bg-card border border-border p-3 rounded-2xl items-center shadow-sm">
                  <Text className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Início</Text>
                  <Text className="text-lg font-black text-foreground">22:00</Text>
                </View>
                <View className="flex-1 bg-card border border-border p-3 rounded-2xl items-center shadow-sm">
                  <Text className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Fim</Text>
                  <Text className="text-lg font-black text-foreground">07:00</Text>
                </View>
              </View>
            )}
          </Animated.View>

          {/* Privacidade e visibilidade */}
          <Animated.View entering={FadeInDown.delay(600)}>
            <SectionTitle title="Privacidade e visibilidade" />
            <View className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden mb-3">
              <ToggleRow icon={User} title="Nome público" desc="Exibir seu nome no perfil." toggleKey="nomePublico" />
              <ToggleRow icon={Camera} title="Foto de perfil" desc="Mostrar seu avatar." toggleKey="fotoPerfil" />
              <ToggleRow icon={Trophy} title="Pontuação" desc="Exibir seus pontos." toggleKey="pontuacao" />
              <ToggleRow icon={Star} title="Gostos" desc="Mostrar interesses selecionados." toggleKey="gostosVisiveis" />
            </View>
            <View className="bg-card border border-border p-4 rounded-2xl shadow-sm flex-row items-center justify-between">
              <View>
                <Text className="font-bold text-foreground text-sm">Pré-visualização pública</Text>
                <Text className="text-[10px] text-muted-foreground mt-0.5">Veja como outros enxergam seu perfil.</Text>
              </View>
              <TouchableOpacity className="bg-primary/20 px-3 py-1.5 rounded-lg">
                <Text className="text-[10px] font-bold text-primary">Ver agora</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Segurança */}
          <Animated.View entering={FadeInDown.delay(650)}>
            <SectionTitle title="Segurança" />
            <View className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden mb-3">
              <ToggleRow icon={ShieldCheck} title="Autenticação em duas etapas" desc="Proteção extra na conta." toggleKey="autenticacao2fa" />
            </View>
            <Text className="text-xs font-bold text-foreground mt-4 mb-2 ml-1">Dispositivos conectados</Text>
            <Text className="text-[10px] text-muted-foreground mb-3 ml-1">Controle de sessões ativas.</Text>
            
            <View className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              {[
                { name: "iPhone 15 Pro", loc: "Sao Paulo, BR • Agora", current: true, icon: Smartphone },
                { name: "Chrome no Windows", loc: "Campinas, BR • Ha 2 horas", current: false, icon: LayoutGrid },
                { name: "Smart TV Samsung", loc: "Santos, BR • Ontem", current: false, icon: Tv }
              ].map((dev, i) => (
                <View key={i} className="flex-row items-center justify-between p-4 border-b border-border/50">
                  <View className="flex-row items-center gap-3">
                    <dev.icon size={20} color={dev.current ? "#ffcc00" : "#999"} />
                    <View>
                      <Text className="font-bold text-foreground text-sm">{dev.name}</Text>
                      <Text className="text-[10px] text-muted-foreground mt-0.5">{dev.loc}</Text>
                    </View>
                  </View>
                  {dev.current ? (
                    <Text className="text-[10px] font-bold text-primary">Este dispositivo</Text>
                  ) : (
                    <TouchableOpacity onPress={() => handleAction("Dispositivo desconectado.")}>
                      <Text className="text-[10px] font-bold text-red-500">Encerrar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Histórico de acessos */}
          <Animated.View entering={FadeInDown.delay(700)}>
            <View className="flex-row items-center justify-between mt-8 mb-3">
              <View>
                <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Histórico de acessos</Text>
                <Text className="text-[10px] text-muted-foreground mt-1">Atividades recentes da conta.</Text>
              </View>
              <TouchableOpacity onPress={() => handleAction("Histórico limpo.")} className="bg-muted px-3 py-1.5 rounded-lg">
                <Text className="text-[10px] font-bold text-foreground">Limpar antigos</Text>
              </TouchableOpacity>
            </View>
            
            <View className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              {[
                { name: "iPhone 15 Pro", loc: "Sao Paulo, BR • Hoje, 08:32 • 189.40.22.10", ok: true },
                { name: "Chrome no Windows", loc: "Campinas, BR • Ontem, 22:11 • 189.40.22.10", ok: true },
                { name: "Smart TV Samsung", loc: "Santos, BR • 20/03, 19:06 • 201.10.40.55", ok: true },
                { name: "Android 14", loc: "Rio de Janeiro, BR • 19/03, 07:54 • 191.90.33.12", ok: false },
              ].map((acc, i) => (
                <View key={i} className="p-4 border-b border-border/50">
                  <View className="flex-row justify-between mb-1">
                    <Text className="font-bold text-foreground text-sm">{acc.name}</Text>
                    <Text className={`text-[10px] font-bold ${acc.ok ? 'text-green-500' : 'text-red-500'}`}>
                      {acc.ok ? 'Acesso ok' : 'Bloqueado'}
                    </Text>
                  </View>
                  <Text className="text-[10px] text-muted-foreground">{acc.loc}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Dados e consentimentos */}
          <Animated.View entering={FadeInDown.delay(750)}>
            <SectionTitle title="Dados e consentimentos" />
            <View className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden mb-3">
              <ToggleRow icon={Mail} title="Marketing e novidades" desc="Receber ofertas e comunicados." toggleKey="marketing" />
              <ToggleRow icon={Sliders} title="Personalização de conteúdo" desc="Recomendações mais relevantes." toggleKey="personalizacao" />
              <ToggleRow icon={Activity} title="Compartilhar dados anônimos" desc="Melhorar o produto." toggleKey="dadosAnonimos" />
            </View>
            <View className="bg-card border border-border p-4 rounded-2xl shadow-sm flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="font-bold text-foreground text-sm">Exportar meus dados</Text>
                <Text className="text-[10px] text-muted-foreground mt-0.5">Baixe um arquivo com suas informações.</Text>
              </View>
              <TouchableOpacity onPress={() => handleAction("Exportação iniciada. Você receberá um e-mail em breve.")} className="bg-muted px-3 py-2 rounded-lg flex-row items-center gap-1">
                <Download size={14} color="#666" />
                <Text className="text-[10px] font-bold text-foreground">Exportar</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Acessibilidade */}
          <Animated.View entering={FadeInDown.delay(800)}>
            <SectionTitle title="Acessibilidade" />
            <View className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <ToggleRow icon={Eye} title="Alto contraste" desc="Aumenta a legibilidade." toggleKey="altoContraste" />
              <View className="p-5 border-t border-border/50">
                <SliderTrack label="Tamanho da fonte" rightLabel="100%" value={50} color="#ffcc00" />
              </View>
            </View>
          </Animated.View>

          {/* Configurações */}
          <Animated.View entering={FadeInDown.delay(850)}>
            <SectionTitle title="Configurações" />
            <View className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden mb-8">
              {[
                { icon: Bell, label: "Notificações" },
                { icon: Shield, label: "Privacidade e Segurança" },
                { icon: AlertCircle, label: "Ajuda e Suporte" },
                { icon: Star, label: "Avalie o BEEP" }
              ].map((item, i) => (
                <TouchableOpacity key={i} className="flex-row items-center justify-between p-4 border-b border-border/50 active:bg-muted">
                  <View className="flex-row items-center gap-3">
                    <View className="w-8 h-8 rounded-full bg-muted items-center justify-center">
                      <item.icon size={16} color="#666" />
                    </View>
                    <Text className="font-bold text-foreground text-sm">{item.label}</Text>
                  </View>
                  <ChevronRight size={16} color="#999" />
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

        </View>
      </ScrollView>

      {/* FAB Controle TV — acima da TabBar (height 70) */}
      <TouchableOpacity
        onPress={() => router.push('/tv-remote')}
        style={{ position: 'absolute', bottom: 70 + insets.bottom + 16, right: 20, zIndex: 200, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ffcc00', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 28, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }}
      >
        <Tv size={20} color="#000" />
        <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 14 }}>Controle TV</Text>
      </TouchableOpacity>
    </View>
  );
}
