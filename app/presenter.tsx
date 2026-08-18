import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { BarChart3, MessageSquare, Calendar, User, ArrowLeft, ChevronDown, TrendingUp, TrendingDown, Users, Eye, Clock, Heart, CheckCircle2, Mic } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// ── Mock Data ─────────────────────────────────────────────────────────────────

const broadcasters = [
  { id: "globo", name: "TV Globo", logo: "🟢", color: "#22c55e" },
  { id: "sbt", name: "SBT", logo: "🔵", color: "#3b82f6" },
  { id: "record", name: "Record TV", logo: "🔴", color: "#ef4444" },
  { id: "band", name: "Band", logo: "🟠", color: "#f97316" },
];

const programs = [
  { id: "jn", broadcasterId: "globo", name: "Jornal Nacional", host: "William Bonner", startTime: "20:00", endTime: "21:00", currentAudience: 28.5, avgAudience: 25.2, peakAudience: 31.0, status: "ao-vivo" },
  { id: "fantástico", broadcasterId: "globo", name: "Fantástico", host: "William Bonner", startTime: "21:00", endTime: "23:00", currentAudience: 22.1, avgAudience: 20.0, peakAudience: 24.8, status: "proximo" },
  { id: "pg", broadcasterId: "globo", name: "Profissão Repórter", host: "Caco Barcellos", startTime: "23:00", endTime: "00:00", currentAudience: 14.3, avgAudience: 13.5, peakAudience: 16.0, status: "proximo" },
  { id: "sbt-tarde", broadcasterId: "sbt", name: "SBT Brasil", host: "Rachel Sheherazade", startTime: "19:00", endTime: "20:00", currentAudience: 8.2, avgAudience: 7.5, peakAudience: 9.1, status: "ao-vivo" },
  { id: "fofocalizando", broadcasterId: "sbt", name: "Fofocalizando", host: "Rachel Sheherazade", startTime: "13:30", endTime: "15:00", currentAudience: 10.5, avgAudience: 9.8, peakAudience: 12.0, status: "proximo" },
  { id: "record-cidade", broadcasterId: "record", name: "Cidade Alerta", host: "Luiz Bacci", startTime: "16:30", endTime: "19:15", currentAudience: 6.8, avgAudience: 6.0, peakAudience: 8.5, status: "ao-vivo" },
  { id: "band-jornal", broadcasterId: "band", name: "Jornal da Band", host: "Rodolfo Gamberini", startTime: "19:45", endTime: "21:30", currentAudience: 5.2, avgAudience: 4.9, peakAudience: 6.1, status: "ao-vivo" },
];

const mockPolls = [
  { id: "p1", question: "Qual tema você quer ver no próximo programa?", status: "active", createdAt: "há 12min", totalVotes: 4823, options: [{ id: "o1", label: "Política", percentage: 42 }, { id: "o2", label: "Economia", percentage: 31 }, { id: "o3", label: "Esportes", percentage: 27 }] },
  { id: "p2", question: "O governo está indo bem nas reformas?", status: "closed", createdAt: "ontem", totalVotes: 12400, options: [{ id: "o1", label: "Sim", percentage: 35 }, { id: "o2", label: "Não", percentage: 65 }] },
];

const mockComments = [
  { id: "c1", userName: "Maria S.", timestamp: "agora", text: "Excelente reportagem! Muito importante para o país.", likes: 24 },
  { id: "c2", userName: "João P.", timestamp: "há 2min", text: "Concordo com tudo que foi dito. Precisamos de mais debates.", likes: 18 },
  { id: "c3", userName: "Ana C.", timestamp: "há 5min", text: "O entrevistado foi muito claro nas suas explicações.", likes: 9 },
  { id: "c4", userName: "Pedro L.", timestamp: "há 7min", text: "Esse assunto precisa de mais atenção na mídia.", likes: 6 },
];

// Generate mock timeline
const generateTimeline = (baseAudience: number) =>
  Array.from({ length: 12 }, (_, i) => ({
    time: `${18 + Math.floor(i / 2)}:${i % 2 === 0 ? "00" : "30"}`,
    audience: +(baseAudience + (Math.random() - 0.4) * 4).toFixed(1),
  }));

// ── Sub-screens ───────────────────────────────────────────────────────────────

const AudienceTab = ({ programs: progs }: { programs: typeof programs }) => {
  const main = progs[0];
  if (!main) return (
    <View className="py-20 items-center"><Text className="text-sm text-muted-foreground">Nenhum programa encontrado.</Text></View>
  );

  const timeline = generateTimeline(main.currentAudience);
  const peak = Math.max(...timeline.map(t => t.audience));
  const min = Math.min(...timeline.map(t => t.audience));
  const chartHeight = 80;

  const stats = [
    { label: "Ao vivo", value: `${main.currentAudience}%`, icon: Eye, trend: main.currentAudience > main.avgAudience ? "up" : "down" },
    { label: "Média", value: `${main.avgAudience}%`, icon: Users, trend: null },
    { label: "Pico", value: `${main.peakAudience}%`, icon: TrendingUp, trend: "up" },
    { label: "Status", value: main.status === "ao-vivo" ? "AO VIVO" : "PRÓXIMO", icon: Clock, trend: null },
  ];

  return (
    <View className="px-5 pt-4 gap-4">
      {/* KPI Grid */}
      <View className="flex-row flex-wrap gap-3">
        {stats.map((s, i) => (
          <Animated.View key={s.label} entering={FadeInDown.delay(i * 60).springify()} className="bg-card rounded-2xl border border-border p-4" style={{ width: (width - 52) / 2 }}>
            <View className="flex-row items-center gap-2 mb-3">
              <View className="w-8 h-8 rounded-xl bg-primary/15 items-center justify-center">
                <s.icon size={16} color="#ffcc00" />
              </View>
              {s.trend === "up" && <TrendingUp size={14} color="#22c55e" style={{ marginLeft: 'auto' }} />}
              {s.trend === "down" && <TrendingDown size={14} color="#ef4444" style={{ marginLeft: 'auto' }} />}
            </View>
            <Text className="text-2xl font-black text-foreground">{s.value}</Text>
            <Text className="text-[10px] text-muted-foreground font-medium mt-0.5">{s.label}</Text>
          </Animated.View>
        ))}
      </View>

      {/* Mini Sparkline Chart */}
      <Animated.View entering={FadeInDown.delay(300).springify()} className="bg-card rounded-2xl border border-border p-4">
        <Text className="text-sm font-bold text-foreground">{main.name}</Text>
        <Text className="text-[10px] text-muted-foreground mb-4">Audiência em tempo real</Text>
        <View className="flex-row items-end gap-1" style={{ height: chartHeight }}>
          {timeline.map((point, i) => {
            const barH = peak === min ? chartHeight / 2 : ((point.audience - min) / (peak - min)) * chartHeight;
            return (
              <View key={i} className="flex-1 bg-primary/30 rounded-full overflow-hidden justify-end">
                <Animated.View entering={FadeInDown.delay(300 + i * 30)} className="bg-primary rounded-full" style={{ height: Math.max(4, barH) }} />
              </View>
            );
          })}
        </View>
        <View className="flex-row justify-between mt-2">
          <Text className="text-[9px] text-muted-foreground">{timeline[0].time}</Text>
          <Text className="text-[9px] text-muted-foreground">{timeline[timeline.length - 1].time}</Text>
        </View>
      </Animated.View>

      {/* Other programs */}
      {progs.length > 1 && (
        <Animated.View entering={FadeInDown.delay(400).springify()} className="gap-2">
          <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Outros Programas</Text>
          {progs.slice(1).map(p => (
            <View key={p.id} className="bg-card rounded-xl border border-border p-3 flex-row items-center justify-between">
              <View>
                <Text className="text-sm font-bold text-foreground">{p.name}</Text>
                <Text className="text-[10px] text-muted-foreground">{p.startTime} — {p.endTime}</Text>
              </View>
              <View className="items-end">
                <Text className="text-base font-black text-foreground">{p.currentAudience}%</Text>
                <Text className="text-[10px] text-muted-foreground">audiência</Text>
              </View>
            </View>
          ))}
        </Animated.View>
      )}
    </View>
  );
};

const PollsTab = () => (
  <View className="px-5 pt-4 gap-5">
    <View className="gap-3">
      <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Enquetes Ativas</Text>
      {mockPolls.map((poll, i) => (
        <Animated.View key={poll.id} entering={FadeInDown.delay(i * 80).springify()} className="bg-card rounded-2xl border border-border p-4">
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1 mr-3">
              <View className="flex-row items-center gap-2 mb-2">
                <View className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full ${poll.status === "active" ? "bg-green-500/10" : "bg-muted"}`}>
                  {poll.status === "active" ? <Clock size={10} color="#22c55e" /> : <CheckCircle2 size={10} color="#888" />}
                  <Text className={`text-[10px] font-bold ${poll.status === "active" ? "text-green-500" : "text-muted-foreground"}`}>
                    {poll.status === "active" ? "Ativa" : "Encerrada"}
                  </Text>
                </View>
                <Text className="text-[10px] text-muted-foreground">{poll.createdAt}</Text>
              </View>
              <Text className="text-sm font-bold text-foreground">{poll.question}</Text>
            </View>
            <View className="flex-row items-center gap-1 bg-primary/10 px-2 py-1 rounded-lg">
              <BarChart3 size={12} color="#ffcc00" />
              <Text className="text-[10px] font-bold text-primary">{(poll.totalVotes / 1000).toFixed(1)}k</Text>
            </View>
          </View>
          <View className="gap-2">
            {poll.options.map(opt => (
              <View key={opt.id}>
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-xs font-semibold text-foreground">{opt.label}</Text>
                  <Text className="text-xs font-bold text-foreground">{opt.percentage}%</Text>
                </View>
                <View className="h-2 bg-muted rounded-full overflow-hidden">
                  <View className="h-full bg-primary rounded-full" style={{ width: `${opt.percentage}%` }} />
                </View>
              </View>
            ))}
          </View>
        </Animated.View>
      ))}
    </View>

    <View className="gap-3">
      <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Comentários Recentes</Text>
      {mockComments.map((comment, i) => (
        <Animated.View key={comment.id} entering={FadeInDown.delay(300 + i * 60).springify()} className="bg-card rounded-xl border border-border p-3">
          <View className="flex-row items-start gap-3">
            <View className="w-8 h-8 rounded-full bg-primary/15 items-center justify-center">
              <Text className="text-xs font-bold text-primary">{comment.userName.charAt(0)}</Text>
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-xs font-bold text-foreground">{comment.userName}</Text>
                <Text className="text-[10px] text-muted-foreground">{comment.timestamp}</Text>
              </View>
              <Text className="text-xs text-foreground/80 mt-0.5 leading-relaxed">{comment.text}</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Heart size={12} color="#888" />
              <Text className="text-[10px] font-semibold text-muted-foreground">{comment.likes}</Text>
            </View>
          </View>
        </Animated.View>
      ))}
    </View>
  </View>
);

const ScheduleTab = ({ programs: progs }: { programs: typeof programs }) => (
  <View className="px-5 pt-4 gap-3">
    <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Programação</Text>
    {progs.map((p, i) => (
      <Animated.View key={p.id} entering={FadeInDown.delay(i * 70).springify()} className="bg-card rounded-2xl border border-border p-4 flex-row items-center gap-4">
        <View className="items-center w-14">
          <Text className="text-xs font-black text-foreground">{p.startTime}</Text>
          <View className="w-0.5 h-4 bg-border my-1" />
          <Text className="text-[10px] text-muted-foreground">{p.endTime}</Text>
        </View>
        <View className="w-0.5 self-stretch bg-border" />
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-sm font-bold text-foreground flex-1">{p.name}</Text>
            {p.status === "ao-vivo" && (
              <View className="flex-row items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded-full">
                <View className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <Text className="text-[9px] font-black text-red-500">AO VIVO</Text>
              </View>
            )}
          </View>
          <Text className="text-[10px] text-muted-foreground">{p.host}</Text>
        </View>
      </Animated.View>
    ))}
  </View>
);

// ── Main Screen ───────────────────────────────────────────────────────────────

type Tab = "audience" | "polls" | "schedule" | "profile";

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: "audience", label: "Audiência", icon: BarChart3 },
  { id: "polls", label: "Interações", icon: MessageSquare },
  { id: "schedule", label: "Agenda", icon: Calendar },
];

export default function PresenterDashboardScreen() {
  const insets = useSafeAreaInsets();
  const [selectedBroadcaster, setSelectedBroadcaster] = useState<typeof broadcasters[0] | null>(null);
  const [selectedHost, setSelectedHost] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("audience");
  const [showPicker, setShowPicker] = useState(false);

  // Step 1 — Pick broadcaster
  if (!selectedBroadcaster) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Animated.View entering={FadeIn} className="items-center mb-10">
          <View className="w-20 h-20 rounded-3xl bg-card-dark items-center justify-center mb-5">
            <Text style={{ fontSize: 36 }}>🎤</Text>
          </View>
          <Text className="text-2xl font-black text-foreground text-center">Painel do Apresentador</Text>
          <Text className="text-sm text-muted-foreground mt-2">Selecione sua emissora</Text>
        </Animated.View>

        <View className="w-full gap-3 max-w-sm">
          {broadcasters.map((b, i) => (
            <Animated.View key={b.id} entering={FadeInDown.delay(i * 80).springify()}>
              <TouchableOpacity
                onPress={() => { setSelectedBroadcaster(b); Haptics.impactAsync(); }}
                className="flex-row items-center gap-4 p-4 bg-card rounded-2xl border border-border active:scale-95"
              >
                <View className="w-12 h-12 rounded-xl items-center justify-center" style={{ backgroundColor: b.color + '20' }}>
                  <Text style={{ fontSize: 24 }}>{b.logo}</Text>
                </View>
                <View>
                  <Text className="font-bold text-foreground">{b.name}</Text>
                  <Text className="text-xs text-muted-foreground">Entrar como apresentador</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        <TouchableOpacity onPress={() => router.back()} className="mt-8 flex-row items-center gap-1">
          <ArrowLeft size={14} color="#888" />
          <Text className="text-sm text-muted-foreground">Voltar ao app</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Step 2 — Pick host
  const broadcasterPrograms = programs.filter(p => p.broadcasterId === selectedBroadcaster.id);
  const hosts = [...new Set(broadcasterPrograms.map(p => p.host))];

  if (!selectedHost) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Animated.View entering={FadeIn} className="items-center mb-8">
          <Text style={{ fontSize: 36, marginBottom: 12 }}>{selectedBroadcaster.logo}</Text>
          <Text className="text-xl font-black text-foreground">Quem é você?</Text>
          <Text className="text-sm text-muted-foreground mt-1">Selecione seu nome</Text>
        </Animated.View>

        <View className="w-full gap-2 max-w-sm">
          {hosts.map((host, i) => (
            <Animated.View key={host} entering={FadeInDown.delay(i * 70).springify()}>
              <TouchableOpacity
                onPress={() => { setSelectedHost(host); Haptics.impactAsync(); }}
                className="flex-row items-center gap-3 p-4 bg-card rounded-2xl border border-border active:scale-95"
              >
                <View className="w-10 h-10 rounded-xl bg-primary/15 items-center justify-center">
                  <Mic size={18} color="#ffcc00" />
                </View>
                <View>
                  <Text className="text-sm font-bold text-foreground">{host}</Text>
                  <Text className="text-[10px] text-muted-foreground" numberOfLines={1}>
                    {broadcasterPrograms.filter(p => p.host === host).map(p => p.name).join(", ")}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        <TouchableOpacity onPress={() => setSelectedBroadcaster(null)} className="mt-6 flex-row items-center gap-1">
          <ArrowLeft size={14} color="#888" />
          <Text className="text-sm text-muted-foreground">Trocar emissora</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const presenterPrograms = broadcasterPrograms.filter(p => p.host === selectedHost);

  return (
    <View className="flex-1 bg-background">
      {/* Top Bar */}
      <View style={{ paddingTop: insets.top }} className="bg-card-dark px-5 pb-4">
        <View className="flex-row items-center justify-between mt-4">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()} className="w-8 h-8 rounded-lg bg-white/10 items-center justify-center">
              <ArrowLeft size={16} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
            <View>
              <Text className="text-[10px] text-card-dark-foreground/40 uppercase tracking-wider font-bold">Apresentador</Text>
              <TouchableOpacity onPress={() => { setShowPicker(v => !v); Haptics.impactAsync(); }} className="flex-row items-center gap-1.5 mt-0.5">
                <Text style={{ fontSize: 18 }}>{selectedBroadcaster.logo}</Text>
                <Text className="text-base font-black text-card-dark-foreground">{selectedHost}</Text>
                <ChevronDown size={14} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </View>
          </View>
          <View className="w-10 h-10 rounded-xl bg-primary/20 items-center justify-center">
            <Mic size={18} color="#ffcc00" />
          </View>
        </View>

        {showPicker && (
          <Animated.View entering={SlideInDown.springify().damping(25)} className="flex-row flex-wrap gap-2 mt-3 pt-3 border-t border-white/10">
            {hosts.map(h => (
              <TouchableOpacity key={h} onPress={() => { setSelectedHost(h); setShowPicker(false); }} className={`px-3 py-2 rounded-xl ${h === selectedHost ? "bg-white/20" : "bg-white/5"}`}>
                <Text className={`text-xs font-semibold ${h === selectedHost ? "text-card-dark-foreground" : "text-card-dark-foreground/50"}`}>{h}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}
      </View>

      {/* Tab Bar */}
      <View className="flex-row bg-muted/50 mx-5 mt-4 mb-2 rounded-xl p-1">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => { setActiveTab(tab.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-lg ${isActive ? "bg-card shadow-sm" : ""}`}
            >
              <tab.icon size={14} color={isActive ? "#ffcc00" : "#888"} />
              <Text className={`text-[11px] font-bold ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {activeTab === "audience" && <AudienceTab programs={presenterPrograms} />}
        {activeTab === "polls" && <PollsTab />}
        {activeTab === "schedule" && <ScheduleTab programs={presenterPrograms} />}
      </ScrollView>
    </View>
  );
}
