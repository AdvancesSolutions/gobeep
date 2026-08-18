import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, TextInput } from 'react-native';
import { BarChart3, Megaphone, Users, Building2, UserCheck, ArrowLeft, Plus, Pause, Play, Check, PencilLine, TrendingUp, TrendingDown, Clock, Image, X } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// ── Dados do Banco de Dados Simulado ─────────────────────────────────────────
import { advertisers, getAdvertiserCampaigns, formatNumber, formatBRL, initialLeads, Lead } from '../constants/advertisers';
import { io } from 'socket.io-client';
import Constants from 'expo-constants';

const hostIp = Constants.expoConfig?.hostUri?.split(':')[0] || '10.0.2.2';
const socket = io(`http://${hostIp}:3002`);

const currentAdvertiserId = "adv1"; // Coca-Cola Brasil
const advertiserData = advertisers.find(a => a.id === currentAdvertiserId) || advertisers[0];
const initialCampaigns = getAdvertiserCampaigns(currentAdvertiserId);

// ── Sub-screens ───────────────────────────────────────────────────────────────
import { Campaign } from '../constants/advertisers';

const MetricsTab = ({ activeCampaigns, totals, leads, liveInteractions }: { activeCampaigns: Campaign[], totals: any, leads: Lead[], liveInteractions: number }) => (
  <View className="px-5 pt-4 gap-4">
    <View className="flex-row flex-wrap gap-3">
      <Animated.View entering={FadeInDown.delay(0).springify()} className="bg-card rounded-2xl border border-border p-4 relative overflow-hidden" style={{ width: (width - 52) / 2 }}>
        {liveInteractions > 0 && (
          <View className="absolute inset-0 bg-green-500/10 pointer-events-none" />
        )}
        <View className="flex-row items-center gap-1.5 mb-1.5">
           <View className="w-1.5 h-1.5 rounded-full bg-green-500" />
           <Text className="text-[9px] font-bold text-green-500 uppercase">Segunda Tela</Text>
        </View>
        <Text className="text-xl font-black text-foreground mt-0">{formatNumber(liveInteractions)}</Text>
        <Text className="text-[10px] text-muted-foreground">Engajamentos Live</Text>
      </Animated.View>
      {[
        { label: "Impressões", value: formatNumber(totals.impressions), desc: "Campanhas ativas" },
        { label: "Cliques", value: formatNumber(totals.clicks), desc: "Taxa média 3,4%" },
        { label: "ROI", value: `${totals.roi}x`, desc: "Retorno médio" },
      ].map((s, i) => (
        <Animated.View key={s.label} entering={FadeInDown.delay((i + 1) * 60).springify()} className="bg-card rounded-2xl border border-border p-4" style={{ width: (width - 52) / 2 }}>
          <Text className="text-xs text-muted-foreground">{s.label}</Text>
          <Text className="text-xl font-black text-foreground mt-2">{s.value}</Text>
          <Text className="text-[10px] text-muted-foreground">{s.desc}</Text>
        </Animated.View>
      ))}
    </View>

    <Animated.View entering={FadeInDown.delay(300).springify()} className="bg-card rounded-2xl border border-border p-4 mt-2">
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text className="text-sm font-semibold text-foreground">Leads Recentes</Text>
          <Text className="text-[10px] text-muted-foreground">Últimos contatos interessados</Text>
        </View>
        <Text className="text-[10px] font-bold text-primary">VER TODOS</Text>
      </View>
      <View className="gap-3">
        {leads.slice(0, 3).map((lead) => (
          <View key={lead.id} className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center">
                <Text className="text-xs font-bold text-primary">{lead.name.charAt(0)}</Text>
              </View>
              <View>
                <Text className="text-xs font-bold text-foreground">{lead.name}</Text>
                <Text className="text-[10px] text-muted-foreground">{lead.campaignName}</Text>
              </View>
            </View>
            <View className={`px-2 py-0.5 rounded-full ${lead.status === 'converted' ? 'bg-emerald-500/15' : lead.status === 'new' ? 'bg-blue-500/15' : lead.status === 'lost' ? 'bg-rose-500/15' : 'bg-amber-500/15'}`}>
              <Text className={`text-[9px] font-bold ${lead.status === 'converted' ? 'text-emerald-500' : lead.status === 'new' ? 'text-blue-500' : lead.status === 'lost' ? 'text-rose-500' : 'text-amber-500'}`}>
                {lead.status.toUpperCase()}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </Animated.View>
  </View>
);

const L_POSITIONS = ['0-0', '0-1', '0-2', '0-3', '1-3', '2-3', '3-3'];

const PremiumSpaceForm = ({ onClose, onCreate }: { onClose: () => void; onCreate: (c: Campaign) => void }) => {
  const [name, setName] = useState('');
  const [formato, setFormato] = useState<'L' | 'horizontal'>('L');
  const [squares, setSquares] = useState<string[]>(L_POSITIONS);
  const [columns, setColumns] = useState<1 | 2>(2);
  const [horario, setHorario] = useState('20:00');
  const [tempo, setTempo] = useState('10');
  const [imagem, setImagem] = useState('');

  const toggleSquare = (id: string) =>
    setSquares(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const precoBase = formato === 'L' ? squares.length * 120 : columns * 300;

  const handleCreate = () => {
    const campaign: Campaign = {
      id: `c_${Date.now()}`,
      advertiserId: currentAdvertiserId,
      name: name.trim() || 'Nova Campanha Premium',
      programIds: [],
      status: 'ativa',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
      budget: precoBase * 10,
      spent: 0,
      impressions: 0,
      clicks: 0,
      reach: 0,
      ctr: 0,
      formato,
      squares: formato === 'L' ? squares : undefined,
      columns: formato === 'horizontal' ? columns : undefined,
      horario,
      tempo: parseInt(tempo) || 10,
      imagem: imagem.trim() || undefined,
      preco: precoBase,
    };
    onCreate(campaign);
    onClose();
  };

  return (
    <View className="absolute inset-0 z-50 bg-black/70 items-center justify-center px-3">
      <View className="w-full bg-card rounded-2xl border border-border p-5 max-h-[92%]">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-black text-foreground">Espaço Premium</Text>
          <TouchableOpacity onPress={onClose}><X size={22} color="#ffcc00" /></TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text className="text-xs font-bold text-muted-foreground uppercase mb-1">Nome da campanha</Text>
          <TextInput className="bg-muted rounded-xl px-4 py-3 text-foreground mb-4" placeholder="Ex: Promoção Coca" placeholderTextColor="#888" value={name} onChangeText={setName} />

          <Text className="text-xs font-bold text-muted-foreground uppercase mb-1">Formato</Text>
          <View className="flex-row gap-2 mb-4">
            {(['L', 'horizontal'] as const).map(f => (
              <TouchableOpacity key={f} onPress={() => setFormato(f)} className={`flex-1 py-3 rounded-xl ${formato === f ? 'bg-primary' : 'bg-muted'}`}>
                <Text className={`text-center font-bold ${formato === f ? 'text-black' : 'text-foreground'}`}>{f === 'L' ? 'Formato L' : 'Horizontal'}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {formato === 'L' ? (
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs font-bold text-muted-foreground uppercase">Quadrados do L</Text>
                <TouchableOpacity onPress={() => setSquares(L_POSITIONS)}><Text className="text-[10px] font-bold text-primary">L inteiro</Text></TouchableOpacity>
              </View>
              <View>
                {[0, 1, 2, 3].map(row => (
                  <View key={row} className="flex-row">
                    {[0, 1, 2, 3].map(col => {
                      const id = `${col}-${row}`;
                      if (!L_POSITIONS.includes(id)) return <View key={col} className="w-12 h-12 m-0.5" />;
                      const sel = squares.includes(id);
                      return (
                        <TouchableOpacity key={col} onPress={() => toggleSquare(id)} className={`w-12 h-12 m-0.5 rounded-lg items-center justify-center ${sel ? 'bg-primary' : 'bg-muted border border-border'}`}>
                          <Text className={`font-bold ${sel ? 'text-black' : 'text-muted-foreground'}`}>{sel ? '✓' : ''}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
              <Text className="text-[10px] text-muted-foreground mt-1">Toque para escolher quais quadrados o anúncio ocupa.</Text>
            </View>
          ) : (
            <View className="mb-4">
              <Text className="text-xs font-bold text-muted-foreground uppercase mb-1">Colunas</Text>
              <View className="flex-row gap-2">
                {([1, 2] as const).map(c => (
                  <TouchableOpacity key={c} onPress={() => setColumns(c)} className={`flex-1 py-3 rounded-xl ${columns === c ? 'bg-primary' : 'bg-muted'}`}>
                    <Text className={`text-center font-bold ${columns === c ? 'text-black' : 'text-foreground'}`}>{c} coluna{c > 1 ? 's' : ''}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <Text className="text-xs font-bold text-muted-foreground uppercase mb-1">Horário</Text>
          <TextInput className="bg-muted rounded-xl px-4 py-3 text-foreground mb-4" placeholder="HH:MM" placeholderTextColor="#888" value={horario} onChangeText={setHorario} />

          <Text className="text-xs font-bold text-muted-foreground uppercase mb-1">Tempo (segundos)</Text>
          <TextInput className="bg-muted rounded-xl px-4 py-3 text-foreground mb-4" placeholder="10" keyboardType="numeric" placeholderTextColor="#888" value={tempo} onChangeText={setTempo} />

          <Text className="text-xs font-bold text-muted-foreground uppercase mb-1">Imagem do anúncio (URL)</Text>
          <TextInput className="bg-muted rounded-xl px-4 py-3 text-foreground mb-4" placeholder="https://..." placeholderTextColor="#888" value={imagem} onChangeText={setImagem} />

          <View className="bg-primary/10 rounded-xl p-3 mb-4">
            <Text className="text-sm font-bold text-primary">Preço estimado: {formatBRL(precoBase)}</Text>
            <Text className="text-[10px] text-muted-foreground mt-0.5">Em produção, quem define os valores são as emissoras de TV.</Text>
          </View>

          <TouchableOpacity onPress={handleCreate} className="bg-primary rounded-xl py-3.5 items-center mb-2">
            <Text className="text-black font-black">Criar campanha e exibir na TV</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

const AdsTab = ({ campaigns, onToggle, onCreate }: { campaigns: Campaign[]; onToggle: (id: string) => void; onCreate: (c: Campaign) => void }) => {
  const [showForm, setShowForm] = useState(false);
  return (
    <View className="px-5 pt-4 gap-4">
      <Animated.View entering={FadeInDown.delay(100).springify()} className="bg-card rounded-2xl border border-border p-4">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-sm font-semibold text-foreground">Nova campanha</Text>
            <Text className="text-[10px] text-muted-foreground">Crie e exiba na TV</Text>
          </View>
          <TouchableOpacity onPress={() => setShowForm(true)} className="bg-primary px-3 py-1.5 rounded-lg flex-row items-center gap-1">
            <Plus size={14} color="#000" />
            <Text className="text-xs font-bold text-black">Criar</Text>
          </TouchableOpacity>
        </View>
        <View className="bg-muted rounded-xl p-3">
          <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Simulador</Text>
          <Text className="text-xs text-foreground mb-2">Com R$ 10.000,00 você alcança aprox. 80.000 pessoas únicas.</Text>
        </View>
      </Animated.View>

      <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-2">Suas Campanhas</Text>
      {campaigns.map((c, i) => (
        <Animated.View key={c.id} entering={FadeInDown.delay(150 + i * 50).springify()} className="bg-card rounded-2xl border border-border p-4">
          <View className="flex-row justify-between mb-3">
            <View>
              <Text className="text-sm font-bold text-foreground">{c.name}</Text>
              <Text className="text-[10px] text-muted-foreground mt-0.5">{c.startDate} - {c.endDate}</Text>
            </View>
            <TouchableOpacity onPress={() => onToggle(c.id)} className="w-8 h-8 rounded-xl bg-card-dark items-center justify-center">
              {c.status === "ativa" ? <Pause size={14} color="#fff" /> : <Play size={14} color="#fff" />}
            </TouchableOpacity>
          </View>
          <View className="flex-row items-center gap-2 mb-3">
            <View className={`px-2 py-0.5 rounded-full ${c.status === "ativa" ? "bg-emerald-500/15" : c.status === "pausada" ? "bg-muted" : "bg-destructive/15"}`}>
              <Text className={`text-[9px] font-bold ${c.status === "ativa" ? "text-emerald-500" : c.status === "pausada" ? "text-muted-foreground" : "text-destructive"}`}>
                {c.status.toUpperCase()}
              </Text>
            </View>
            {c.formato && <Text className="text-[10px] font-bold text-primary uppercase">{c.formato}</Text>}
            <Text className="text-[10px] font-bold text-muted-foreground">Gasto: R$ {formatNumber(c.spent)} / {formatNumber(c.budget)}</Text>
          </View>
          <View className="flex-row justify-between bg-muted/40 p-3 rounded-xl">
            <View className="items-center">
              <Text className="text-[10px] text-muted-foreground mb-0.5">Impressões</Text>
              <Text className="text-xs font-bold text-foreground">{formatNumber(c.impressions)}</Text>
            </View>
            <View className="items-center">
              <Text className="text-[10px] text-muted-foreground mb-0.5">Cliques</Text>
              <Text className="text-xs font-bold text-foreground">{formatNumber(c.clicks)}</Text>
            </View>
            <View className="items-center">
              <Text className="text-[10px] text-muted-foreground mb-0.5">ROI</Text>
              <Text className="text-xs font-bold text-foreground">{c.ctr}x</Text>
            </View>
          </View>
        </Animated.View>
      ))}

      {showForm && <PremiumSpaceForm onClose={() => setShowForm(false)} onCreate={onCreate} />}
    </View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────

type Tab = "metrics" | "ads" | "leads";
const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: "metrics", label: "Métricas", icon: BarChart3 },
  { id: "ads", label: "Campanhas", icon: Megaphone },
  { id: "leads", label: "Leads", icon: UserCheck },
];

export default function AdvertiserDashboardScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>("metrics");
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [liveInteractions, setLiveInteractions] = useState(0);

  React.useEffect(() => {
    socket.on('new_lead', (leadData: Lead) => {
      setLeads((prev) => [leadData, ...prev]);
      setLiveInteractions((prev) => prev + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });

    socket.on('new_recognition', () => {
      setLiveInteractions((prev) => prev + 1);
    });

    socket.on('poll_vote', () => {
      setLiveInteractions((prev) => prev + 1);
    });

    return () => {
      socket.off('new_lead');
      socket.off('new_recognition');
      socket.off('poll_vote');
    };
  }, []);

  const activeCampaigns = campaigns.filter((c) => c.status === "ativa" || c.status === "active");
  const totals = useMemo(() => {
    const impressions = activeCampaigns.reduce((sum, c) => sum + c.impressions, 0);
    const clicks = activeCampaigns.reduce((sum, c) => sum + c.clicks, 0);
    const reach = activeCampaigns.reduce((sum, c) => sum + c.reach, 0);
    const roi = activeCampaigns.length ? +(activeCampaigns.reduce((sum, c) => sum + c.ctr, 0) / activeCampaigns.length).toFixed(2) : 0;
    return { impressions, clicks, reach, roi };
  }, [activeCampaigns]);

  const toggleCampaign = (id: string) => {
    Haptics.impactAsync();
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: c.status === "ativa" ? "pausada" : "ativa" } : c));
  };

  const handleCreateCampaign = (c: Campaign) => {
    setCampaigns(prev => [c, ...prev]);
    // Exibe o anúncio em overlay na TV (servidor repassa para a TV conectada).
    socket.emit('ad_show', {
      id: c.id,
      nome: c.name,
      formato: c.formato,
      squares: c.squares,
      columns: c.columns,
      tempo: c.tempo || 10,
      imagem: c.imagem,
    });
  };

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
              <Text className="text-[10px] text-card-dark-foreground/40 uppercase tracking-wider font-bold">Anunciante</Text>
              <Text className="text-base font-black text-card-dark-foreground">{advertiserData.name}</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-1 bg-primary/20 px-2 py-1 rounded-lg">
            <Megaphone size={14} color="#ffcc00" />
            <Text className="text-[10px] font-bold text-primary">ATIVAS {activeCampaigns.length}</Text>
          </View>
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
              <tab.icon size={14} color={isActive ? "#3b82f6" : "#888"} />
              <Text className={`text-[11px] font-bold ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 20, 40) }} showsVerticalScrollIndicator={false}>
        {activeTab === "metrics" && <MetricsTab activeCampaigns={activeCampaigns} totals={totals} leads={leads} liveInteractions={liveInteractions} />}
        {activeTab === "ads" && <AdsTab campaigns={campaigns} onToggle={toggleCampaign} onCreate={handleCreateCampaign} />}
        {activeTab === "leads" && (
          <View className="px-5 pt-4 gap-3">
            <Text className="text-sm font-bold text-foreground mb-2">Todos os Leads</Text>
            {leads.map((lead) => (
              <View key={lead.id} className="bg-card border border-border p-4 rounded-2xl">
                <View className="flex-row justify-between mb-2">
                  <Text className="font-bold text-foreground">{lead.name}</Text>
                  <View className={`px-2 py-0.5 rounded-full ${lead.status === 'new' ? 'bg-blue-500/15' : 'bg-emerald-500/15'}`}>
                    <Text className={`text-[9px] font-bold ${lead.status === 'new' ? 'text-blue-500' : 'text-emerald-500'}`}>
                      {lead.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text className="text-xs text-muted-foreground">{lead.email} | {lead.phone}</Text>
                <Text className="text-[10px] text-muted-foreground mt-1">Via {lead.campaignName} - {lead.date}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
