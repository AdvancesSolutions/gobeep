import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, TextInput } from 'react-native';
import { ListChecks, Plus, Flame, LayoutDashboard, User, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// ── Mock Data ─────────────────────────────────────────────────────────────────

const cargoLabels: Record<string, string> = {
  presidente: "Presidência da República",
  governador: "Governo do Estado",
  senador: "Senado Federal",
  deputado_federal: "Deputado(a) Federal",
  deputado_estadual: "Deputado(a) Estadual",
  prefeito: "Prefeitura",
  vereador: "Vereador(a)",
};

const cargoIcons: Record<string, string> = {
  presidente: "🇧🇷",
  governador: "🏛️",
  senador: "📜",
  deputado_federal: "⚖️",
  deputado_estadual: "📝",
  prefeito: "🏢",
  vereador: "🏙️",
};

const mockPolls = [
  { id: "p1", question: "Como você avalia nossa gestão na saúde?", totalVotes: 12450, status: "active", options: [{ label: "Ótima", pct: 45 }, { label: "Boa", pct: 30 }, { label: "Regular", pct: 15 }, { label: "Ruim", pct: 10 }] },
  { id: "p2", question: "Aprova a nova ciclofaixa do centro?", totalVotes: 8320, status: "closed", options: [{ label: "Aprovo totalmente", pct: 60 }, { label: "Aprovo parcialmente", pct: 20 }, { label: "Desaprovo", pct: 20 }] },
];

const mockBets = [
  { id: "b1", title: "O projeto de lei 123 será aprovado amanhã?", options: [{ label: "Sim", odds: 1.4 }, { label: "Não", odds: 2.8 }], amount: 25000 },
  { id: "b2", title: "Em qual área devemos focar os novos recursos?", options: [{ label: "Educação", odds: 1.2 }, { label: "Segurança", odds: 1.8 }], amount: 48000 },
];

// ── Sub-screens ───────────────────────────────────────────────────────────────

const SetupTab = ({ onComplete }: { onComplete: (data: any) => void }) => {
  const [cargo, setCargo] = useState<string | null>(null);
  
  if (!cargo) {
    return (
      <View className="px-5 pt-8 gap-3">
        <Text className="text-xl font-black text-foreground mb-4">Escolha o cargo</Text>
        {Object.entries(cargoLabels).map(([key, label], i) => (
          <Animated.View key={key} entering={FadeInDown.delay(i * 50).springify()}>
            <TouchableOpacity onPress={() => { setCargo(key); Haptics.impactAsync(); }} className="flex-row items-center gap-3 p-4 bg-card rounded-2xl border border-border active:scale-95">
              <Text style={{ fontSize: 24 }}>{cargoIcons[key]}</Text>
              <Text className="font-bold text-foreground text-base">{label}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    );
  }

  return (
    <View className="px-5 pt-4 gap-4">
      <TouchableOpacity onPress={() => setCargo(null)} className="w-8 h-8 rounded-full bg-muted items-center justify-center mb-2">
        <ArrowLeft size={16} color="#888" />
      </TouchableOpacity>
      <View className="flex-row items-center gap-3 mb-4">
        <Text style={{ fontSize: 32 }}>{cargoIcons[cargo]}</Text>
        <View>
          <Text className="text-xl font-black text-foreground">Cadastro</Text>
          <Text className="text-sm text-muted-foreground">{cargoLabels[cargo]}</Text>
        </View>
      </View>

      <View className="gap-4">
        <View>
          <Text className="text-xs font-bold text-muted-foreground uppercase mb-2">Nome do Político/Gabinete</Text>
          <TextInput placeholder="Ex: Gabinete João Silva" placeholderTextColor="#666" className="w-full h-12 bg-card border border-border rounded-xl px-4 text-sm text-foreground" />
        </View>
        <View>
          <Text className="text-xs font-bold text-muted-foreground uppercase mb-2">Partido</Text>
          <TextInput placeholder="Ex: PL, PT, MDB..." placeholderTextColor="#666" className="w-full h-12 bg-card border border-border rounded-xl px-4 text-sm text-foreground" />
        </View>
        <View>
          <Text className="text-xs font-bold text-muted-foreground uppercase mb-2">Estado</Text>
          <TextInput placeholder="Ex: SP, RJ, MG..." placeholderTextColor="#666" className="w-full h-12 bg-card border border-border rounded-xl px-4 text-sm text-foreground" />
        </View>
        
        <TouchableOpacity onPress={() => onComplete({ cargo, nome: "João Silva" })} className="w-full h-12 bg-primary rounded-xl items-center justify-center mt-4">
          <Text className="font-bold text-black">Acessar Painel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const PollsTab = () => (
  <View className="px-5 pt-4 gap-4">
    {mockPolls.map((poll, i) => (
      <Animated.View key={poll.id} entering={FadeInDown.delay(i * 50).springify()} className="bg-card rounded-2xl border border-border p-4">
        <View className="flex-row justify-between mb-4">
          <View className="flex-1 mr-3">
            <View className={`self-start px-2 py-0.5 rounded-full mb-2 ${poll.status === "active" ? "bg-emerald-500/15" : "bg-muted"}`}>
              <Text className={`text-[9px] font-bold ${poll.status === "active" ? "text-emerald-500" : "text-muted-foreground"}`}>
                {poll.status === "active" ? "ATIVA" : "ENCERRADA"}
              </Text>
            </View>
            <Text className="text-sm font-bold text-foreground">{poll.question}</Text>
          </View>
          <View className="items-end">
            <Text className="text-xs font-bold text-primary">{(poll.totalVotes / 1000).toFixed(1)}k</Text>
            <Text className="text-[10px] text-muted-foreground">votos</Text>
          </View>
        </View>
        <View className="gap-2">
          {poll.options.map(opt => (
            <View key={opt.label}>
              <View className="flex-row justify-between mb-1">
                <Text className="text-xs font-semibold text-foreground">{opt.label}</Text>
                <Text className="text-xs font-bold text-foreground">{opt.pct}%</Text>
              </View>
              <View className="h-1.5 bg-muted rounded-full overflow-hidden">
                <View className="h-full bg-primary" style={{ width: `${opt.pct}%` }} />
              </View>
            </View>
          ))}
        </View>
      </Animated.View>
    ))}
  </View>
);

const BetsTab = () => (
  <View className="px-5 pt-4 gap-4">
    <View className="flex-row justify-between items-center bg-card rounded-2xl border border-border p-4 mb-2">
      <View>
        <Text className="text-sm font-semibold text-foreground">Criar Nova Aposta</Text>
        <Text className="text-[10px] text-muted-foreground">Engaje sua base com desafios</Text>
      </View>
      <TouchableOpacity className="bg-primary px-3 py-1.5 rounded-lg flex-row items-center gap-1">
        <Plus size={14} color="#000" />
        <Text className="text-xs font-bold text-black">Criar</Text>
      </TouchableOpacity>
    </View>

    <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 mt-2">Apostas da Comunidade</Text>
    {mockBets.map((bet, i) => (
      <Animated.View key={bet.id} entering={FadeInDown.delay(i * 50).springify()} className="bg-card rounded-2xl border border-border p-4">
        <Text className="text-sm font-bold text-foreground mb-3">{bet.title}</Text>
        <View className="flex-row gap-2 mb-3">
          {bet.options.map(opt => (
            <View key={opt.label} className="flex-1 bg-muted/50 rounded-xl p-2 items-center">
              <Text className="text-[10px] text-muted-foreground">{opt.label}</Text>
              <Text className="text-sm font-bold text-primary">{opt.odds}x</Text>
            </View>
          ))}
        </View>
        <View className="flex-row items-center gap-1">
          <Flame size={12} color="#ffcc00" />
          <Text className="text-[10px] text-muted-foreground">{bet.amount} pontos apostados na rede</Text>
        </View>
      </Animated.View>
    ))}
  </View>
);

// ── Main Screen ───────────────────────────────────────────────────────────────

type Tab = "pesquisas" | "apostas" | "resultados";
const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: "pesquisas", label: "Pesquisas", icon: ListChecks },
  { id: "apostas", label: "Apostas", icon: Flame },
  { id: "resultados", label: "Resultados", icon: LayoutDashboard },
];

export default function PoliticianDashboardScreen() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>("pesquisas");

  if (!profile) {
    return (
      <View className="flex-1 bg-background">
        <View style={{ paddingTop: insets.top }} className="bg-card-dark px-5 pb-4">
          <View className="flex-row items-center gap-3 mt-4">
            <TouchableOpacity onPress={() => router.back()} className="w-8 h-8 rounded-lg bg-white/10 items-center justify-center">
              <ArrowLeft size={16} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
            <View>
              <Text className="text-base font-black text-card-dark-foreground">Portal Político</Text>
            </View>
          </View>
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 20, 40) }}>
          <SetupTab onComplete={setProfile} />
        </ScrollView>
      </View>
    );
  }

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
              <Text className="text-[10px] text-card-dark-foreground/40 uppercase tracking-wider font-bold">{cargoLabels[profile.cargo]}</Text>
              <Text className="text-base font-black text-card-dark-foreground">{profile.nome}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 24 }}>{cargoIcons[profile.cargo]}</Text>
        </View>
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
              <tab.icon size={14} color={isActive ? "#22c55e" : "#888"} />
              <Text className={`text-[11px] font-bold ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 20, 40) }} showsVerticalScrollIndicator={false}>
        {activeTab === "pesquisas" && <PollsTab />}
        {activeTab === "apostas" && <BetsTab />}
        {activeTab === "resultados" && (
          <View className="px-5 pt-4">
            <Text className="text-sm font-bold text-foreground">Relatórios em breve</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
