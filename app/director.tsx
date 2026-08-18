import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { BarChart3, Calendar, Tv, ArrowLeft, ChevronDown, TrendingUp, TrendingDown, Users, Eye, PlayCircle } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// ── Mock Data ─────────────────────────────────────────────────────────────────

const broadcasters = [
  { id: "globo", name: "TV Globo", shortName: "Globo", logo: "🟢", color: "#22c55e" },
  { id: "sbt", name: "SBT", shortName: "SBT", logo: "🔵", color: "#3b82f6" },
  { id: "record", name: "Record TV", shortName: "Record", logo: "🔴", color: "#ef4444" },
  { id: "band", name: "Band", shortName: "Band", logo: "🟠", color: "#f97316" },
];

const programsData = [
  { id: "p1", name: "Jornal da Manhã", type: "Jornalismo", currentAudience: 12.5, share: 34, status: "ao-vivo" },
  { id: "p2", name: "Esporte Total", type: "Esportes", currentAudience: 8.2, share: 22, status: "proximo" },
  { id: "p3", name: "Novela das 9", type: "Entretenimento", currentAudience: 28.4, share: 45, status: "proximo" },
];

// ── Sub-screens ───────────────────────────────────────────────────────────────

const OverviewTab = () => (
  <View className="px-5 pt-4 gap-4">
    <View className="flex-row flex-wrap gap-3">
      {[
        { label: "Audiência Média", value: "14.2", desc: "pontos (IBOPE)", trend: "up" },
        { label: "Share (TV)", value: "32%", desc: "televisores ligados", trend: "up" },
        { label: "Pico Diário", value: "31.5", desc: "às 21h30", trend: null },
        { label: "Faturamento", value: "R$ 2.4M", desc: "hoje (estimado)", trend: "up" },
      ].map((s, i) => (
        <Animated.View key={s.label} entering={FadeInDown.delay(i * 60).springify()} className="bg-card rounded-2xl border border-border p-4" style={{ width: (width - 52) / 2 }}>
          <Text className="text-xs text-muted-foreground">{s.label}</Text>
          <View className="flex-row items-center gap-1 mt-2">
            <Text className="text-xl font-black text-foreground">{s.value}</Text>
            {s.trend === "up" && <TrendingUp size={14} color="#22c55e" />}
          </View>
          <Text className="text-[10px] text-muted-foreground mt-1">{s.desc}</Text>
        </Animated.View>
      ))}
    </View>

    <Animated.View entering={FadeInDown.delay(300).springify()} className="bg-card rounded-2xl border border-border p-4 mt-2">
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text className="text-sm font-semibold text-foreground">Programas no Ar</Text>
          <Text className="text-[10px] text-muted-foreground">Desempenho em tempo real</Text>
        </View>
        <Tv size={16} color="#ef4444" />
      </View>
      <View className="gap-3">
        {programsData.map((prog) => (
          <View key={prog.id} className="flex-row items-center justify-between">
            <View>
              <View className="flex-row items-center gap-2">
                <Text className="text-sm font-bold text-foreground">{prog.name}</Text>
                {prog.status === "ao-vivo" && (
                  <View className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                )}
              </View>
              <Text className="text-[10px] text-muted-foreground">{prog.type}</Text>
            </View>
            <View className="items-end">
              <Text className="text-sm font-bold text-foreground">{prog.currentAudience} pts</Text>
              <Text className="text-[10px] text-muted-foreground">Share {prog.share}%</Text>
            </View>
          </View>
        ))}
      </View>
    </Animated.View>
  </View>
);

// ── Main Screen ───────────────────────────────────────────────────────────────

type Tab = "overview" | "schedule" | "programs";
const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: "overview", label: "Audiência", icon: BarChart3 },
  { id: "schedule", label: "Grade", icon: Calendar },
  { id: "programs", label: "Programas", icon: Tv },
];

export default function DirectorDashboardScreen() {
  const insets = useSafeAreaInsets();
  const [selectedBroadcaster, setSelectedBroadcaster] = useState<typeof broadcasters[0] | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showPicker, setShowPicker] = useState(false);

  // Broadcaster Selection Step
  if (!selectedBroadcaster) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Animated.View entering={FadeIn} className="items-center mb-10">
          <View className="w-20 h-20 rounded-3xl bg-card-dark items-center justify-center mb-5">
            <Tv size={36} color="#ef4444" />
          </View>
          <Text className="text-2xl font-black text-foreground text-center">Painel do Diretor</Text>
          <Text className="text-sm text-muted-foreground mt-2">Selecione a emissora para gerenciar</Text>
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
                  <Text className="text-xs text-muted-foreground">Gerenciar como diretor</Text>
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
              <Text className="text-[10px] text-card-dark-foreground/40 uppercase tracking-wider font-bold">Painel do Diretor</Text>
              <TouchableOpacity onPress={() => { setShowPicker(v => !v); Haptics.impactAsync(); }} className="flex-row items-center gap-1.5 mt-0.5">
                <Text style={{ fontSize: 18 }}>{selectedBroadcaster.logo}</Text>
                <Text className="text-base font-black text-card-dark-foreground">{selectedBroadcaster.shortName}</Text>
                <ChevronDown size={14} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </View>
          </View>
          <View className="flex-row items-center gap-1 px-2 py-1 rounded-lg" style={{ backgroundColor: selectedBroadcaster.color + '20' }}>
            <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: selectedBroadcaster.color }} />
            <Text className="text-[10px] font-bold" style={{ color: selectedBroadcaster.color }}>AO VIVO</Text>
          </View>
        </View>

        {showPicker && (
          <Animated.View entering={SlideInDown.springify().damping(25)} className="flex-row flex-wrap gap-2 mt-3 pt-3 border-t border-white/10">
            {broadcasters.map(b => (
              <TouchableOpacity key={b.id} onPress={() => { setSelectedBroadcaster(b); setShowPicker(false); }} className={`px-3 py-2 rounded-xl flex-row items-center gap-1 ${b.id === selectedBroadcaster.id ? "bg-white/20" : "bg-white/5"}`}>
                <Text>{b.logo}</Text>
                <Text className={`text-xs font-semibold ${b.id === selectedBroadcaster.id ? "text-card-dark-foreground" : "text-card-dark-foreground/50"}`}>{b.shortName}</Text>
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
              <tab.icon size={14} color={isActive ? selectedBroadcaster.color : "#888"} />
              <Text className={`text-[11px] font-bold ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 20, 40) }} showsVerticalScrollIndicator={false}>
        {activeTab === "overview" && <OverviewTab />}
        {activeTab !== "overview" && (
          <View className="px-5 pt-4">
            <Text className="text-sm font-bold text-foreground">Em desenvolvimento</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
