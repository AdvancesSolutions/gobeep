import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Pressable, StyleSheet } from 'react-native';
import { Trophy, Flame, Target, Gamepad2, Flag, Car, CircleDot, X, ChevronRight, Zap, Check } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, SlideInDown, SlideOutDown, FadeOut } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { usePoints } from '../../contexts/PointsContext';
import { PageHeader } from '../../components/PageHeader';

export interface UserBet {
  id: string;
  apostaId: string;
  opcaoId: string;
  valor: number;
  odd: number;
  data: string;
  status: "pendente" | "vencida" | "perdida";
  retornoPotencial: number;
}

interface ApostaOpcao {
  id: string;
  label: string;
  odds: number;
}

interface ApostaPreditiva {
  id: string;
  titulo: string;
  categoria: string;
  dataLimite: string;
  descricao: string;
  status: "ativa" | "finalizada";
  opcoes: ApostaOpcao[];
  vencedorId?: string;
}

type Category = {
  id: string;
  label: string;
  icon: React.ElementType;
  bgStr: string;
  iconColor: string;
};

const categories: Category[] = [
  { id: "futebol", label: "Futebol", icon: CircleDot, bgStr: "rgba(34, 197, 94, 0.1)", iconColor: "#22c55e" },
  { id: "basquete", label: "Basquete", icon: Target, bgStr: "rgba(249, 115, 22, 0.1)", iconColor: "#f97316" },
  { id: "superball", label: "Superball", icon: Trophy, bgStr: "rgba(59, 130, 246, 0.1)", iconColor: "#3b82f6" },
  { id: "formula1", label: "Fórmula 1", icon: Car, bgStr: "rgba(239, 68, 68, 0.1)", iconColor: "#ef4444" },
  { id: "golf", label: "Golf", icon: Flag, bgStr: "rgba(16, 185, 129, 0.1)", iconColor: "#10b981" },
  { id: "games", label: "E-Sports", icon: Gamepad2, bgStr: "rgba(168, 85, 247, 0.1)", iconColor: "#a855f7" },
  { id: "politica", label: "Política", icon: Flame, bgStr: "rgba(245, 158, 11, 0.1)", iconColor: "#f59e0b" },
];

type Match = {
  id: number;
  category: string;
  teamA: string;
  teamB: string;
  oddsA: number;
  oddsDraw?: number;
  oddsB: number;
  time: string;
  live?: boolean;
};

const matches: Match[] = [
  { id: 1, category: "futebol", teamA: "Benfica", teamB: "Porto", oddsA: 2.1, oddsDraw: 3.2, oddsB: 3.5, time: "Hoje, 20:00", live: true },
  { id: 2, category: "futebol", teamA: "Sporting", teamB: "Braga", oddsA: 1.8, oddsDraw: 3.5, oddsB: 4.2, time: "Amanhã, 18:30" },
  { id: 3, category: "basquete", teamA: "Lakers", teamB: "Celtics", oddsA: 1.9, oddsB: 1.95, time: "Hoje, 23:00", live: true },
  { id: 4, category: "superball", teamA: "Chiefs", teamB: "Eagles", oddsA: 1.7, oddsB: 2.2, time: "Domingo, 00:30" },
  { id: 5, category: "formula1", teamA: "Verstappen", teamB: "Hamilton", oddsA: 1.5, oddsB: 3.0, time: "Domingo, 15:00" },
  { id: 6, category: "golf", teamA: "Scheffler", teamB: "McIlroy", oddsA: 2.0, oddsB: 2.1, time: "Sábado, 14:00" },
  { id: 7, category: "games", teamA: "LOUD", teamB: "FURIA", oddsA: 1.6, oddsB: 2.4, time: "Hoje, 21:00", live: true },
  { id: 8, category: "politica", teamA: "Candidato A", teamB: "Candidato B", oddsA: 1.4, oddsB: 3.1, time: "Resultado: 15 Mar" },
  { id: 9, category: "futebol", teamA: "Real Madrid", teamB: "Barcelona", oddsA: 2.3, oddsDraw: 3.0, oddsB: 2.9, time: "Sábado, 21:00" },
  { id: 10, category: "basquete", teamA: "Warriors", teamB: "Bucks", oddsA: 2.1, oddsB: 1.8, time: "Amanhã, 01:00" },
];

export default function BetsScreen() {
  const { totalPoints, removePoints } = usePoints();
  const insets = useSafeAreaInsets();
  
  const [activeTab, setActiveTab] = useState<"explorar" | "minhas">("explorar");
  const [activeCategory, setActiveCategory] = useState("futebol");
  const [userBets, setUserBets] = useState<UserBet[]>([]);
  
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedPredictive, setSelectedPredictive] = useState<ApostaPreditiva | null>(null);
  const [selectedPredictiveOption, setSelectedPredictiveOption] = useState<ApostaOpcao | null>(null);
  const [selectedOdd, setSelectedOdd] = useState<"A" | "draw" | "B" | null>(null);
  const [betAmount, setBetAmount] = useState("");
  const [betConfirmed, setBetConfirmed] = useState(false);
  const [dynamicBets, setDynamicBets] = useState<ApostaPreditiva[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedApostas = await AsyncStorage.getItem("beep_apostas");
        if (savedApostas) setDynamicBets(JSON.parse(savedApostas));
        
        const savedUserBets = await AsyncStorage.getItem("beep_user_bets");
        if (savedUserBets) setUserBets(JSON.parse(savedUserBets));
      } catch (e) {}
    };
    loadData();
  }, [activeTab]); // Reload when switching tabs

  const filteredMatches = matches.filter(m => m.category === activeCategory);
  const filteredPredictive = dynamicBets.filter(b => b.categoria === activeCategory && (b.status === "ativa" || b.status === "finalizada"));
  const activeCat = categories.find(c => c.id === activeCategory)!;

  const potentialWin = (selectedMatch && selectedOdd || selectedPredictive && selectedPredictiveOption) && betAmount
    ? (Number(betAmount) * (
        selectedMatch 
          ? (selectedOdd === "A" ? selectedMatch.oddsA : selectedOdd === "draw" ? (selectedMatch.oddsDraw || 0) : selectedMatch.oddsB)
          : (selectedPredictiveOption?.odds || 0)
      )).toFixed(0)
    : "0";

  return (
    <View className="flex-1 bg-background">
      <PageHeader title="Apostas" totalPoints={totalPoints} />

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Balance strip */}
        <Animated.View entering={FadeInDown.delay(50).springify()} className="px-5 py-4">
          <View className="flex-row items-center justify-between bg-card rounded-2xl p-4 border border-border/50">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-primary/15 items-center justify-center">
                <Trophy size={20} color="#ffcc00" />
              </View>
              <View>
                <Text className="text-[11px] text-muted-foreground uppercase tracking-wider font-bold">Saldo para apostas</Text>
                <View className="flex-row items-baseline gap-1">
                  <Text className="text-2xl font-black text-foreground">{totalPoints}</Text>
                  <Text className="text-sm font-bold text-muted-foreground">pts</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={() => router.push('/wallet')} className="flex-row items-center gap-1">
              <Text className="text-xs font-bold text-primary">Carteira</Text>
              <ChevronRight size={14} color="#ffcc00" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Main Tabs */}
        <Animated.View entering={FadeInDown.delay(100).springify()} className="px-5 mb-4">
          <View className="flex-row bg-muted rounded-xl p-1.5">
            <TouchableOpacity
              onPress={() => { setActiveTab("explorar"); Haptics.impactAsync(); }}
              className={`flex-1 py-3 rounded-lg items-center justify-center transition-all ${activeTab === "explorar" ? "bg-card shadow-sm" : ""}`}
            >
              <Text className={`text-xs font-bold ${activeTab === "explorar" ? "text-foreground" : "text-muted-foreground"}`}>EXPLORAR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setActiveTab("minhas"); Haptics.impactAsync(); }}
              className={`flex-1 py-3 rounded-lg flex-row items-center justify-center gap-2 transition-all ${activeTab === "minhas" ? "bg-card shadow-sm" : ""}`}
            >
              <Text className={`text-xs font-bold ${activeTab === "minhas" ? "text-foreground" : "text-muted-foreground"}`}>MINHAS APOSTAS</Text>
              {userBets.filter(b => b.status === "pendente").length > 0 && (
                <View className="w-4 h-4 rounded-full bg-primary items-center justify-center">
                  <Text className="text-black text-[9px] font-bold">{userBets.filter(b => b.status === "pendente").length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {activeTab === "explorar" ? (
          <Animated.View entering={FadeIn}>
            {/* Categories */}
            <View className="mb-6">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => { setActiveCategory(cat.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                      className={`flex-row items-center gap-2 px-4 py-3 rounded-2xl transition-all ${
                        isActive ? "bg-primary" : "bg-card border border-border/50"
                      }`}
                      style={isActive ? { elevation: 4, shadowColor: '#ffcc00', shadowOpacity: 0.3, shadowRadius: 8 } : {}}
                    >
                      <Icon size={16} color={isActive ? "#000" : cat.iconColor} />
                      <Text className={`text-xs font-bold ${isActive ? "text-black" : "text-muted-foreground"}`}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View className="px-5 flex-row items-center gap-2 mb-4">
              <View className="w-2 h-2 rounded-full bg-primary" />
              <Text className="font-bold text-sm text-foreground">{activeCat.label}</Text>
              <Text className="text-xs text-muted-foreground font-semibold">({filteredMatches.length + filteredPredictive.length} eventos)</Text>
            </View>

            {/* Predictive Bets (Dynamic) */}
            {filteredPredictive.length > 0 && (
              <View className="px-5 gap-4 mb-4">
                {filteredPredictive.map((bet, index) => (
                  <Animated.View key={bet.id} entering={FadeInDown.delay(index * 50).springify()} className="bg-primary/5 rounded-2xl border border-primary/20 p-4">
                    <View className="flex-row items-center justify-between mb-4">
                      <Text className="text-[11px] text-muted-foreground font-semibold">
                        {bet.status === "finalizada" ? "Encerrada" : `Termina em: ${new Date(bet.dataLimite).toLocaleDateString()}`}
                      </Text>
                      <View className="flex-row items-center gap-1">
                        <Flame size={12} color={bet.status === "finalizada" ? "#888" : "#ffcc00"} className={bet.status === "ativa" ? "animate-pulse" : ""} />
                        <Text className={`text-[10px] font-bold ${bet.status === "finalizada" ? "text-muted-foreground" : "text-primary"}`}>PREDITIVA</Text>
                      </View>
                    </View>

                    <View className="mb-5 items-center">
                      <Text className="text-base font-bold text-foreground text-center mb-1">{bet.titulo}</Text>
                      {bet.descricao ? <Text className="text-xs text-muted-foreground text-center">{bet.descricao}</Text> : null}
                    </View>

                    <View className="flex-row gap-2 flex-wrap">
                      {bet.opcoes.map((op) => {
                        const isWinner = (bet as any).vencedorId === op.id;
                        return (
                          <TouchableOpacity
                            key={op.id}
                            disabled={bet.status === "finalizada"}
                            onPress={() => {
                              setSelectedPredictive(bet);
                              setSelectedPredictiveOption(op);
                              setSelectedMatch(null);
                              setSelectedOdd(null);
                              setBetAmount("");
                              Haptics.impactAsync();
                            }}
                            className={`flex-1 min-w-[45%] border rounded-xl py-3 items-center justify-center relative active:scale-95 ${
                              isWinner ? "bg-yellow-500/20 border-yellow-500" : "bg-card border-primary/20"
                            } ${bet.status === "finalizada" ? "opacity-60" : ""}`}
                          >
                            <Text className="text-xs text-muted-foreground text-center px-2 mb-1">{op.label}</Text>
                            <Text className="text-lg font-black text-primary">{op.odds.toFixed(2)}</Text>
                            {isWinner && <Trophy size={14} color="#eab308" className="absolute top-2 right-2" />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </Animated.View>
                ))}
              </View>
            )}

            {/* Matches */}
            <View className="px-5 gap-4">
              {filteredMatches.map((match, index) => (
                <Animated.View key={match.id} entering={FadeInDown.delay((filteredPredictive.length + index) * 50).springify()} className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm">
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-[11px] font-semibold text-muted-foreground">{match.time}</Text>
                    {match.live && (
                      <View className="flex-row items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded-full">
                        <Zap size={10} color="#ef4444" />
                        <Text className="text-[10px] font-bold text-red-500">AO VIVO</Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-row items-center justify-between mb-5">
                    <Text className="text-base font-bold text-foreground flex-1" numberOfLines={1}>{match.teamA}</Text>
                    <Text className="text-xs font-black text-muted-foreground mx-3">VS</Text>
                    <Text className="text-base font-bold text-foreground flex-1 text-right" numberOfLines={1}>{match.teamB}</Text>
                  </View>

                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => { setSelectedMatch(match); setSelectedOdd("A"); setBetAmount(""); Haptics.impactAsync(); }}
                      className="flex-1 bg-muted rounded-xl py-3 items-center active:scale-95"
                    >
                      <Text className="text-xs text-muted-foreground font-semibold mb-1">1</Text>
                      <Text className="text-base font-black text-foreground">{match.oddsA.toFixed(2)}</Text>
                    </TouchableOpacity>
                    {match.oddsDraw !== undefined && (
                      <TouchableOpacity
                        onPress={() => { setSelectedMatch(match); setSelectedOdd("draw"); setBetAmount(""); Haptics.impactAsync(); }}
                        className="flex-1 bg-muted rounded-xl py-3 items-center active:scale-95"
                      >
                        <Text className="text-xs text-muted-foreground font-semibold mb-1">X</Text>
                        <Text className="text-base font-black text-foreground">{match.oddsDraw.toFixed(2)}</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => { setSelectedMatch(match); setSelectedOdd("B"); setBetAmount(""); Haptics.impactAsync(); }}
                      className="flex-1 bg-muted rounded-xl py-3 items-center active:scale-95"
                    >
                      <Text className="text-xs text-muted-foreground font-semibold mb-1">2</Text>
                      <Text className="text-base font-black text-foreground">{match.oddsB.toFixed(2)}</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        ) : (
          /* User Bets Tab */
          <Animated.View entering={FadeIn} className="px-5">
            <View className="flex-row items-center justify-between mb-4 mt-2">
              <Text className="font-bold text-sm text-foreground uppercase tracking-widest">Seu Histórico</Text>
              <Text className="text-[10px] font-bold text-muted-foreground uppercase">{userBets.length} APOSTAS</Text>
            </View>

            {userBets.length > 0 ? (
              <View className="gap-4">
                {[...userBets].reverse().map((bet, index) => {
                  const predictiveBet = dynamicBets.find(b => b.id === bet.apostaId);
                  const title = predictiveBet?.titulo || (bet.apostaId.startsWith("match-") ? "Partida Esportiva" : "Aposta");
                  const optionLabel = predictiveBet 
                    ? predictiveBet.opcoes.find(o => o.id === bet.opcaoId)?.label 
                    : (bet.opcaoId === "A" ? "Time Casa" : bet.opcaoId === "B" ? "Time Fora" : "Empate");

                  const isWon = bet.status === "vencida";
                  const isLost = bet.status === "perdida";
                  const iconBg = isWon ? "bg-green-500/10" : isLost ? "bg-red-500/10" : "bg-primary/10";
                  const statusBg = isWon ? "bg-green-500/15" : isLost ? "bg-red-500/15" : "bg-primary/15";
                  const statusColor = isWon ? "text-green-500" : isLost ? "text-red-400" : "text-primary";

                  return (
                    <Animated.View key={bet.id} entering={FadeInDown.delay(index * 50).springify()} className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                      <View className="flex-row justify-between items-start mb-4">
                        <View className="flex-row items-center gap-3">
                          <View className={`w-10 h-10 rounded-xl items-center justify-center ${iconBg}`}>
                            {isWon ? <Trophy size={18} color="#22c55e" /> : 
                             isLost ? <X size={18} color="#f87171" /> : 
                             <Zap size={18} color="#ffcc00" />}
                          </View>
                          <View>
                            <Text className="text-sm font-black text-foreground">{title}</Text>
                            <Text className="text-[11px] text-muted-foreground mt-0.5">{new Date(bet.data).toLocaleDateString()}</Text>
                          </View>
                        </View>
                        <View className={`px-2.5 py-1 rounded-full ${statusBg}`}>
                          <Text className={`text-[10px] font-black uppercase ${statusColor}`}>{bet.status}</Text>
                        </View>
                      </View>

                      <View className="flex-row items-center justify-between py-3 border-y border-border/50">
                        <View>
                          <Text className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Seu Palpite</Text>
                          <Text className="text-sm font-bold text-foreground">{optionLabel}</Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Odd</Text>
                          <Text className="text-sm font-black text-primary">{bet.odd.toFixed(2)}</Text>
                        </View>
                      </View>

                      <View className="flex-row items-center justify-between mt-4">
                        <View>
                          <Text className="text-[10px] text-muted-foreground font-bold mb-1">VALOR</Text>
                          <Text className="text-base font-black text-foreground">{bet.valor} pts</Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-[10px] text-muted-foreground font-bold mb-1">{isWon ? "GANHO" : "RETORNO POTENCIAL"}</Text>
                          <Text className={`text-xl font-black tabular-nums ${isWon ? "text-green-500" : "text-primary"}`}>
                            {isWon ? `+${bet.retornoPotencial}` : bet.retornoPotencial} 
                            <Text className="text-xs font-bold ml-1"> pts</Text>
                          </Text>
                        </View>
                      </View>
                    </Animated.View>
                  );
                })}
              </View>
            ) : (
              <View className="py-20 items-center">
                <View className="w-20 h-20 rounded-3xl bg-muted items-center justify-center mb-6">
                  <Flame size={40} color="#888" />
                </View>
                <Text className="text-lg font-bold text-foreground mb-2">Nenhuma aposta feita</Text>
                <Text className="text-sm text-muted-foreground text-center px-10 mb-8">
                  Suas apostas aparecerão aqui depois que você confirmar seu primeiro palpite.
                </Text>
                <TouchableOpacity 
                  onPress={() => setActiveTab("explorar")}
                  className="bg-primary px-8 py-4 rounded-2xl active:opacity-80 shadow-lg shadow-primary/30"
                >
                  <Text className="text-black font-black">EXPLORAR EVENTOS</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        )}
      </ScrollView>

      {/* Bet Modal Overlay */}
      <Modal visible={(selectedMatch !== null || selectedPredictive !== null)} transparent animationType="fade">
        <Pressable style={StyleSheet.absoluteFill} className="bg-black/70 backdrop-blur-md" onPress={() => { setSelectedMatch(null); setSelectedPredictive(null); setSelectedPredictiveOption(null); setSelectedOdd(null); }} />
        
        <Animated.View entering={SlideInDown.springify().damping(25)} exiting={SlideOutDown} className="absolute bottom-0 left-0 right-0 bg-card rounded-t-[32px] p-6 border-t border-border/50" style={{ paddingBottom: Math.max(insets.bottom + 40, 80) }}>
          <View className="w-12 h-1.5 rounded-full bg-border mx-auto mb-6" />
          
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-xl font-black text-foreground">Fazer Aposta</Text>
            <TouchableOpacity onPress={() => { setSelectedMatch(null); setSelectedPredictive(null); setSelectedPredictiveOption(null); setSelectedOdd(null); }} className="w-8 h-8 rounded-full bg-muted items-center justify-center">
              <X size={16} color="#888" />
            </TouchableOpacity>
          </View>

          <View className="bg-muted rounded-2xl p-4 mb-5 border border-border/50">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-bold text-foreground flex-1 mr-2">
                {selectedMatch ? `${selectedMatch.teamA} vs ${selectedMatch.teamB}` : selectedPredictive?.titulo}
              </Text>
              {(selectedMatch?.live || selectedPredictive) && (
                <View className="bg-primary/20 px-2 py-0.5 rounded-full">
                  <Text className="text-[10px] font-bold text-primary">ATIVA</Text>
                </View>
              )}
            </View>
            <Text className="text-xs text-muted-foreground font-medium">
              Aposta: <Text className="font-bold text-foreground">
                {selectedMatch 
                  ? (selectedOdd === "A" ? selectedMatch.teamA : selectedOdd === "draw" ? "Empate" : selectedMatch.teamB)
                  : selectedPredictiveOption?.label}
              </Text>
              {" — Odd: "}
              <Text className="font-bold text-primary">
                {selectedMatch 
                  ? (selectedOdd === "A" ? selectedMatch.oddsA : selectedOdd === "draw" ? selectedMatch.oddsDraw : selectedMatch.oddsB)?.toFixed(2)
                  : selectedPredictiveOption?.odds.toFixed(2)}
              </Text>
            </Text>
          </View>

          <View className="mb-5">
            <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Quantidade de pontos</Text>
            <TextInput
              keyboardType="numeric"
              value={betAmount}
              onChangeText={setBetAmount}
              placeholder="0"
              placeholderTextColor="#666"
              className="w-full h-14 bg-muted rounded-2xl px-4 text-lg font-bold text-foreground mb-2 border border-border/50"
            />
            <View className="flex-row items-center justify-between">
              <Text className="text-[11px] font-medium text-muted-foreground">Saldo: {totalPoints} pts</Text>
              <View className="flex-row gap-2">
                {[10, 25, 50].map(v => (
                  <TouchableOpacity
                    key={v}
                    onPress={() => { setBetAmount(String(Math.min(v, totalPoints))); Haptics.impactAsync(); }}
                    className="bg-primary/15 rounded-lg px-3 py-1.5 border border-primary/20"
                  >
                    <Text className="text-[11px] font-bold text-primary">+{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View className="bg-primary/10 rounded-2xl p-4 mb-6 flex-row items-center justify-between border border-primary/20">
            <Text className="text-xs font-bold text-muted-foreground">Retorno potencial</Text>
            <Text className="text-2xl font-black text-primary tabular-nums">{potentialWin} pts</Text>
          </View>

          <TouchableOpacity
            onPress={async () => {
              if (!betAmount || Number(betAmount) <= 0) return;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              
              const amount = Number(betAmount);
              const odd = selectedMatch 
                ? (selectedOdd === "A" ? selectedMatch.oddsA : selectedOdd === "draw" ? (selectedMatch.oddsDraw || 0) : selectedMatch.oddsB)
                : (selectedPredictiveOption?.odds || 0);
              
              const newUserBet: UserBet = {
                id: Math.random().toString(36).substring(2, 9),
                apostaId: selectedMatch ? `match-${selectedMatch.id}` : selectedPredictive?.id || "",
                opcaoId: selectedMatch ? selectedOdd! : selectedPredictiveOption?.id || "",
                valor: amount,
                odd: odd || 1,
                data: new Date().toISOString(),
                status: "pendente",
                retornoPotencial: Math.floor(amount * (odd || 1))
              };

              const existingUserBetsStr = await AsyncStorage.getItem("beep_user_bets");
              const existingUserBets = existingUserBetsStr ? JSON.parse(existingUserBetsStr) : [];
              await AsyncStorage.setItem("beep_user_bets", JSON.stringify([...existingUserBets, newUserBet]));

              removePoints(amount);
              setUserBets([...existingUserBets, newUserBet]);
              setBetConfirmed(true);
              
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              
              setTimeout(() => {
                setBetConfirmed(false);
                setSelectedMatch(null);
                setSelectedPredictive(null);
                setSelectedPredictiveOption(null);
                setSelectedOdd(null);
                setBetAmount("");
              }, 1800);
            }}
            disabled={!betAmount || Number(betAmount) <= 0 || betConfirmed || Number(betAmount) > totalPoints}
            className={`w-full h-14 rounded-2xl items-center justify-center flex-row shadow-lg ${
              (!betAmount || Number(betAmount) <= 0 || Number(betAmount) > totalPoints) ? "bg-muted" : "bg-primary"
            }`}
          >
            <Text className={`font-bold text-base ${(!betAmount || Number(betAmount) <= 0 || Number(betAmount) > totalPoints) ? "text-muted-foreground" : "text-black"}`}>
              Confirmar Aposta
            </Text>
          </TouchableOpacity>

          {/* Success overlay */}
          {betConfirmed && (
            <Animated.View
              entering={FadeIn}
              exiting={FadeOut}
              className="absolute inset-0 bg-card rounded-t-[32px] flex flex-col items-center justify-center z-10"
            >
              <Animated.View entering={SlideInDown.springify()} className="w-24 h-24 rounded-full bg-primary/20 items-center justify-center mb-6">
                <Check size={48} color="#ffcc00" strokeWidth={3} />
              </Animated.View>
              <Animated.Text entering={FadeInDown.delay(100)} className="text-2xl font-black text-foreground mb-2">
                Aposta Confirmada!
              </Animated.Text>
              <Animated.Text entering={FadeInDown.delay(200)} className="text-sm font-medium text-muted-foreground">
                Retorno potencial: <Text className="font-bold text-primary">{potentialWin} pts</Text>
              </Animated.Text>
            </Animated.View>
          )}
        </Animated.View>
      </Modal>
    </View>
  );
}
