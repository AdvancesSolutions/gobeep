import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  Check,
  Megaphone,
  Pause,
  PencilLine,
  Play,
  Plus,
  Users,
  UserCheck,
  Mail,
  Phone,
  MessageCircle,
} from "lucide-react";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { initialLeads, Lead, LeadStatus, Campaign } from "@/data/advertisers";
import { io } from "socket.io-client";
import { useEffect } from "react";

const socket = io("http://localhost:3002");

type Tab = "metrics" | "ads" | "audience" | "leads" | "company";

// initialLeads and Lead types are now imported from data/advertisers.ts

const tabs = [
  { id: "metrics" as Tab, label: "Métricas", icon: BarChart3 },
  { id: "ads" as Tab, label: "Anúncios", icon: Megaphone },
  { id: "leads" as Tab, label: "Leads", icon: UserCheck },
  { id: "audience" as Tab, label: "Audiência", icon: Users },
  { id: "company" as Tab, label: "Empresa", icon: Building2 },
];

const initialCampaigns: Campaign[] = [
  {
    id: "c1",
    advertiserId: "adv1",
    programIds: ["g1"],
    startDate: "2026-03-10",
    endDate: "2026-04-05",
    ctr: 2.6,
    name: "Festival de Inverno",
    status: "active",
    impressions: 182400,
    clicks: 6120,
    reach: 87400,
    budget: 24000,
    spent: 16800,
  },
  {
    id: "c2",
    advertiserId: "adv1",
    programIds: ["g1"],
    startDate: "2026-03-15",
    endDate: "2026-04-12",
    ctr: 3.1,
    name: "Semana do Esporte",
    status: "active",
    impressions: 128900,
    clicks: 3840,
    reach: 65200,
    budget: 18000,
    spent: 11250,
  },
  {
    id: "c3",
    advertiserId: "adv1",
    programIds: ["g1"],
    startDate: "2026-03-01",
    endDate: "2026-03-28",
    ctr: 1.9,
    name: "Lançamento Linha Premium",
    status: "paused",
    impressions: 98600,
    clicks: 2750,
    reach: 43800,
    budget: 20000,
    spent: 14600,
  },
];

const audiencePrograms = [
  { id: "p1", name: "Manhã em Movimento", reach: 48200, affinity: 78, share: 32 },
  { id: "p2", name: "Jornal da Cidade", reach: 55600, affinity: 71, share: 28 },
  { id: "p3", name: "Top Hits Night", reach: 41800, affinity: 83, share: 24 },
  { id: "p4", name: "Esporte Total", reach: 39200, affinity: 69, share: 19 },
];

const performanceTimeline = [
  { day: "10/03", impressions: 12400, clicks: 320 },
  { day: "12/03", impressions: 16800, clicks: 390 },
  { day: "14/03", impressions: 15200, clicks: 360 },
  { day: "16/03", impressions: 19800, clicks: 450 },
  { day: "18/03", impressions: 21400, clicks: 520 },
  { day: "20/03", impressions: 18600, clicks: 430 },
  { day: "22/03", impressions: 23200, clicks: 610 },
  { day: "24/03", impressions: 20600, clicks: 540 },
];

const heatmapDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const heatmapHours = ["06h", "09h", "12h", "15h", "18h", "21h"];
const heatmapMatrix = [
  [42, 55, 63, 58, 70, 48],
  [50, 64, 75, 69, 82, 56],
  [46, 60, 68, 61, 77, 52],
  [40, 58, 72, 66, 84, 60],
  [44, 62, 74, 70, 88, 64],
  [38, 54, 66, 59, 80, 58],
];

const performanceChartConfig = {
  impressions: {
    label: "Impressões",
    color: "hsl(var(--primary))",
  },
  clicks: {
    label: "Cliques",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig;

const formatNumber = (value: number) => value.toLocaleString("pt-BR");
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const AdvertiserDashboard = ({ onBack }: { onBack: () => void }) => {
  const [activeTab, setActiveTab] = useState<Tab>("metrics");
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [editingName, setEditingName] = useState("");
  const [editingBudget, setEditingBudget] = useState("0");
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignBudget, setNewCampaignBudget] = useState("");
  const [newCampaignPeriod, setNewCampaignPeriod] = useState("");
  const [simBudget, setSimBudget] = useState("25000");
  const [simDays, setSimDays] = useState("30");
  const [simShare, setSimShare] = useState("28");
  const [liveInteractions, setLiveInteractions] = useState(0);

  useEffect(() => {
    socket.on('new_lead', (leadData: Lead) => {
      setLeads((prev) => [leadData, ...prev]);
      setLiveInteractions((prev) => prev + 1);
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

  const companyProfile = {
    name: "Coca-Cola Brasil",
    contact: "midia@cocacola.com.br",
    phone: "+55 11 99999-0000",
    website: "www.cocacola.com.br",
    city: "São Paulo, SP",
  };

  const activeCampaigns = campaigns.filter((c) => c.status === "active");
  const totals = useMemo(() => {
    const impressions = activeCampaigns.reduce((sum, c) => sum + c.impressions, 0);
    const clicks = activeCampaigns.reduce((sum, c) => sum + c.clicks, 0);
    const reach = activeCampaigns.reduce((sum, c) => sum + c.reach, 0);
    const roi = activeCampaigns.length
      ? +(activeCampaigns.reduce((sum, c) => sum + c.ctr, 0) / activeCampaigns.length).toFixed(2)
      : 0;
    return { impressions, clicks, reach, roi };
  }, [activeCampaigns]);

  const qualityInsights = useMemo(
    () =>
      activeCampaigns.map((campaign) => {
        const scoreBase = 58 + campaign.ctr * 12 + campaign.clicks / 700;
        const score = clamp(Math.round(scoreBase), 60, 98);
        const risk = score < 72 ? "alto" : score < 86 ? "médio" : "baixo";
        const message =
          score < 72
            ? "CTR abaixo do esperado, ajuste criativos"
            : score < 86
              ? "Performance estável, há espaço para otimizar"
              : "Acima da média, mantenha o investimento";
        return { ...campaign, score, risk, message };
      }),
    [activeCampaigns]
  );

  const simulatorResult = useMemo(() => {
    const budget = Number(simBudget) || 0;
    const days = Number(simDays) || 1;
    const share = Number(simShare) || 0;
    const cpm = 28;
    const impressions = Math.round((budget / cpm) * 1000 * (0.6 + share / 100));
    const clicks = Math.round(impressions * 0.032);
    const reach = Math.round(impressions * 0.38);
    const roi = +(1.4 + Math.min(2.4, budget / 15000) + share / 60).toFixed(2);
    const dailyBudget = Math.round(budget / Math.max(days, 1));
    return { impressions, clicks, reach, roi, dailyBudget };
  }, [simBudget, simDays, simShare]);

  const handleCreateCampaign = (payload?: { name?: string; budget?: string; period?: string }) => {
    const id = `c${Date.now()}`;
    const budget = Number(payload?.budget) || 12000;
    const name = payload?.name?.trim() || "Nova campanha";
    const period = payload?.period?.trim() || "Hoje - 30 dias";
    const newCampaign: Campaign = {
      id,
      advertiserId: "adv1",
      programIds: ["g1"],
      startDate: "2026-06-11",
      endDate: "2026-07-11",
      name,
      status: "active",
      impressions: 42000,
      clicks: 980,
      reach: 21400,
      ctr: 2.2,
      budget,
      spent: Math.round(budget * 0.2),
    };
    setCampaigns((prev) => [newCampaign, ...prev]);
    setActiveTab("ads");
    setEditingId(id);
    setEditingName(newCampaign.name);
    setEditingBudget(String(newCampaign.budget));
    setNewCampaignName("");
    setNewCampaignBudget("");
    setNewCampaignPeriod("");
  };

  const handleToggleStatus = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: c.status === "active" ? "paused" : "active" } : c))
    );
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingId(campaign.id);
    setEditingName(campaign.name);
    setEditingBudget(String(campaign.budget));
  };

  const handleSave = () => {
    if (!editingId) return;
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === editingId
          ? { ...c, name: editingName.trim() || c.name, budget: Number(editingBudget) || c.budget }
          : c
      )
    );
    setEditingId(null);
  };

  const handleUpdateLeadStatus = (leadId: string, newStatus: LeadStatus) => {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
  };

  const getStatusLabel = (status: LeadStatus) => {
    const configs = {
      new: { label: "Novo", color: "text-blue-500", bg: "bg-blue-500/15" },
      contacted: { label: "Em contato", color: "text-amber-500", bg: "bg-amber-500/15" },
      converted: { label: "Convertido", color: "text-emerald-500", bg: "bg-emerald-500/15" },
      lost: { label: "Perdido", color: "text-rose-500", bg: "bg-rose-500/15" },
    };
    return configs[status];
  };

  return (
    <div className="h-full bg-background flex flex-col">
      <div className="bg-card-dark px-4 pt-10 pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-8 h-8 rounded-lg bg-card-dark-foreground/10 flex items-center justify-center">
              <ArrowLeft size={16} className="text-card-dark-foreground/70" />
            </button>
            <div>
              <p className="text-[10px] text-card-dark-foreground/40 uppercase tracking-wider font-medium">Painel do Anunciante</p>
              <p className="text-lg font-black text-card-dark-foreground">{companyProfile.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/15">
            <Megaphone size={16} className="text-primary" />
            <span className="text-[10px] font-bold text-primary">ATIVAS {activeCampaigns.length}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-28">
        <AnimatePresence mode="wait">
          {activeTab === "metrics" && (
            <motion.div key="metrics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-card rounded-2xl border border-border p-4">
                    <p className="text-xs text-muted-foreground">Impressões</p>
                    <p className="text-xl font-black text-foreground mt-2">{formatNumber(totals.impressions)}</p>
                    <p className="text-[10px] text-muted-foreground">Campanhas ativas</p>
                  </div>
                  <div className="bg-card rounded-2xl border border-border p-4">
                    <p className="text-xs text-muted-foreground">Cliques</p>
                    <p className="text-xl font-black text-foreground mt-2">{formatNumber(totals.clicks)}</p>
                    <p className="text-[10px] text-muted-foreground">Taxa média 3,4%</p>
                  </div>
                  <div className="bg-card rounded-2xl border border-border p-4">
                    <p className="text-xs text-muted-foreground">Alcance</p>
                    <p className="text-xl font-black text-foreground mt-2">{formatNumber(totals.reach)}</p>
                    <p className="text-[10px] text-muted-foreground">Público único</p>
                  </div>
                  <div className="bg-card rounded-2xl border border-border p-4 relative overflow-hidden">
                    {liveInteractions > 0 && (
                      <div className="absolute inset-0 bg-green-500/10 animate-pulse pointer-events-none" />
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Segunda Tela</p>
                    </div>
                    <p className="text-xl font-black text-foreground mt-2">{formatNumber(liveInteractions)}</p>
                    <p className="text-[10px] text-muted-foreground">Engajamentos ao Vivo</p>
                  </div>
                </div>

                <div className="bg-card rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Leads Recentes</p>
                      <p className="text-xs text-muted-foreground">Últimos contatos interessados</p>
                    </div>
                    <button onClick={() => setActiveTab("leads")} className="text-[10px] font-bold text-primary">VER TODOS</button>
                  </div>
                  <div className="mt-4 space-y-3">
                    {leads.slice(0, 2).map((lead) => (
                      <div key={lead.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {lead.name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground">{lead.name}</p>
                            <p className="text-[10px] text-muted-foreground">{lead.campaignName}</p>
                          </div>
                        </div>
                        <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${getStatusLabel(lead.status).bg} ${getStatusLabel(lead.status).color}`}>
                          {getStatusLabel(lead.status).label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Evolução de performance</p>
                      <p className="text-xs text-muted-foreground">Impressões e cliques das campanhas ativas</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground">Últimas 2 semanas</span>
                  </div>
                  <div className="mt-4">
                    <ChartContainer config={performanceChartConfig} className="h-56 w-full">
                      <LineChart data={performanceTimeline} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray="4 4" />
                        <XAxis dataKey="day" tickLine={false} axisLine={false} />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          width={36}
                          tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                        />
                        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Line
                          type="monotone"
                          dataKey="impressions"
                          stroke="var(--color-impressions)"
                          strokeWidth={2.5}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="clicks"
                          stroke="var(--color-clicks)"
                          strokeWidth={2.5}
                          dot={false}
                        />
                      </LineChart>
                    </ChartContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-[10px] text-muted-foreground">
                    <div className="bg-muted/40 rounded-xl p-3">
                      <p className="text-[10px]">Pico de impressões</p>
                      <p className="text-sm font-semibold text-foreground">{formatNumber(23200)}</p>
                    </div>
                    <div className="bg-muted/40 rounded-xl p-3">
                      <p className="text-[10px]">Pico de cliques</p>
                      <p className="text-sm font-semibold text-foreground">{formatNumber(610)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Score de qualidade</p>
                      <p className="text-xs text-muted-foreground">Risco e oportunidades por campanha</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground">Atualizado hoje</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {qualityInsights.map((campaign) => (
                      <div key={campaign.id} className="bg-muted/40 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{campaign.name}</p>
                            <p className="text-[10px] text-muted-foreground">{campaign.message}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-foreground">{campaign.score}</p>
                            <span
                              className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                                campaign.risk === "alto"
                                  ? "bg-rose-500/15 text-rose-500"
                                  : campaign.risk === "médio"
                                    ? "bg-amber-500/15 text-amber-500"
                                    : "bg-emerald-500/15 text-emerald-500"
                              }`}
                            >
                              risco {campaign.risk}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Mapa de calor por horario</p>
                      <p className="text-xs text-muted-foreground">Oportunidades de insercao por dia</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground">Ultimos 7 dias</span>
                  </div>
                  <div className="mt-4 grid grid-cols-[auto_repeat(6,minmax(0,1fr))] gap-2 text-[10px]">
                    <div />
                    {heatmapHours.map((hour) => (
                      <div key={hour} className="text-center text-muted-foreground">
                        {hour}
                      </div>
                    ))}
                    {heatmapDays.map((day, rowIndex) => (
                      <div key={day} className="contents">
                        <div className="flex items-center text-muted-foreground">{day}</div>
                        {heatmapMatrix[rowIndex].map((value, colIndex) => (
                          <div
                            key={`${day}-${colIndex}`}
                            className="h-8 rounded-lg border border-border/60"
                            style={{ backgroundColor: `hsl(var(--primary) / ${0.08 + value / 140})` }}
                            title={`Indice ${value}`}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Baixo potencial</span>
                    <div className="flex items-center gap-1">
                      {[0.12, 0.2, 0.28, 0.36].map((opacity) => (
                        <span key={opacity} className="w-6 h-2 rounded-full" style={{ backgroundColor: `hsl(var(--primary) / ${opacity})` }} />
                      ))}
                    </div>
                    <span>Alto potencial</span>
                  </div>
                </div>

                <div className="bg-card rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Campanhas em destaque</p>
                      <p className="text-xs text-muted-foreground">Desempenho das campanhas ativas</p>
                    </div>
                    <BarChart3 size={18} className="text-primary" />
                  </div>
                  <div className="mt-4 space-y-3">
                    {activeCampaigns.map((campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{campaign.name}</p>
                          <p className="text-[10px] text-muted-foreground">{campaign.period}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-foreground">{campaign.ctr}x</p>
                          <p className="text-[10px] text-muted-foreground">ROI</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "ads" && (
            <motion.div key="ads" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="p-4 space-y-3">
                <div className="bg-card rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Nova campanha</p>
                      <p className="text-[10px] text-muted-foreground">Crie rapidamente sem sair do painel</p>
                    </div>
                    <button
                      onClick={() =>
                        handleCreateCampaign({
                          name: newCampaignName,
                          budget: newCampaignBudget,
                          period: newCampaignPeriod,
                        })
                      }
                      className="h-9 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-2"
                    >
                      <Plus size={14} />
                      Criar
                    </button>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground">Nome da campanha</label>
                      <input
                        className="mt-1 w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                        placeholder="Ex: Outono Premiado"
                        value={newCampaignName}
                        onChange={(event) => setNewCampaignName(event.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-muted-foreground">Empresa</label>
                      <input
                        className="mt-1 w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                        value={companyProfile.name}
                        disabled
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Contato</label>
                      <input
                        className="mt-1 w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                        value={companyProfile.contact}
                        disabled
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-muted-foreground">Telefone</label>
                        <input
                          className="mt-1 w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                          value={companyProfile.phone}
                          disabled
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Cidade</label>
                        <input
                          className="mt-1 w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                          value={companyProfile.city}
                          disabled
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Site</label>
                      <input
                        className="mt-1 w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                        value={companyProfile.website}
                        disabled
                      />
                    </div>                  </div>
                    </div>
                  </div>
                </div>
                <div className="bg-card rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Simulador de midia</p>
                      <p className="text-[10px] text-muted-foreground">Estimativa antes de ativar</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground">CPM medio R$ 28</span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground">Orcamento (R$)</label>
                      <input
                        className="mt-1 w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                        value={simBudget}
                        onChange={(event) => setSimBudget(event.target.value)}
                        inputMode="numeric"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Duracao (dias)</label>
                      <input
                        className="mt-1 w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                        value={simDays}
                        onChange={(event) => setSimDays(event.target.value)}
                        inputMode="numeric"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Share alvo (%)</label>
                      <input
                        className="mt-1 w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                        value={simShare}
                        onChange={(event) => setSimShare(event.target.value)}
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="bg-muted/40 rounded-xl p-3">
                      <p className="text-[10px] text-muted-foreground">Impressões previstas</p>
                      <p className="text-sm font-semibold text-foreground">{formatNumber(simulatorResult.impressions)}</p>
                    </div>
                    <div className="bg-muted/40 rounded-xl p-3">
                      <p className="text-[10px] text-muted-foreground">Cliques estimados</p>
                      <p className="text-sm font-semibold text-foreground">{formatNumber(simulatorResult.clicks)}</p>
                    </div>
                    <div className="bg-muted/40 rounded-xl p-3">
                      <p className="text-[10px] text-muted-foreground">Alcance projetado</p>
                      <p className="text-sm font-semibold text-foreground">{formatNumber(simulatorResult.reach)}</p>
                    </div>
                    <div className="bg-muted/40 rounded-xl p-3">
                      <p className="text-[10px] text-muted-foreground">ROI esperado</p>
                      <p className="text-sm font-semibold text-foreground">{simulatorResult.roi}x</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Orcamento diario sugerido</span>
                    <span className="text-foreground font-semibold">R$ {formatNumber(simulatorResult.dailyBudget)}</span>
                  </div>
                </div>
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="bg-card rounded-2xl border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        {editingId === campaign.id ? (
                          <input
                            className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground w-full"
                            value={editingName}
                            onChange={(event) => setEditingName(event.target.value)}
                          />
                        ) : (
                          <p className="text-sm font-semibold text-foreground">{campaign.name}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">{campaign.startDate} - {campaign.endDate}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${campaign.status === "active" ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                            {campaign.status === "active" ? "Ativa" : "Pausada"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">Gasto R$ {formatNumber(campaign.spent)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleToggleStatus(campaign.id)}
                          className="w-9 h-9 rounded-xl bg-card-dark flex items-center justify-center text-card-dark-foreground"
                          title={campaign.status === "active" ? "Pausar campanha" : "Ativar campanha"}
                        >
                          {campaign.status === "active" ? <Pause size={16} /> : <Play size={16} />}
                        </button>
                        {editingId === campaign.id ? (
                          <button
                            onClick={handleSave}
                            className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center"
                            title="Salvar alterações"
                          >
                            <Check size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEdit(campaign)}
                            className="w-9 h-9 rounded-xl bg-muted text-foreground flex items-center justify-center"
                            title="Editar campanha"
                          >
                            <PencilLine size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Impressões</p>
                        <p className="text-sm font-bold text-foreground">{formatNumber(campaign.impressions)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Cliques</p>
                        <p className="text-sm font-bold text-foreground">{formatNumber(campaign.clicks)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">ROI</p>
                        <p className="text-sm font-bold text-foreground">{campaign.ctr}x</p>
                      </div>
                    </div>
                    {editingId === campaign.id && (
                      <div className="mt-4">
                        <label className="text-[10px] text-muted-foreground">Orçamento (R$)</label>
                        <input
                          className="mt-1 w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                          value={editingBudget}
                          onChange={(event) => setEditingBudget(event.target.value)}
                          inputMode="numeric"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "audience" && (
            <motion.div key="audience" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="p-4 space-y-3">
                {audiencePrograms.map((program) => (
                  <div key={program.id} className="bg-card rounded-2xl border border-border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{program.name}</p>
                        <p className="text-[10px] text-muted-foreground">Alcance {formatNumber(program.reach)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">{program.affinity}%</p>
                        <p className="text-[10px] text-muted-foreground">Afinidade</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>Share</span>
                        <span>{program.share}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted mt-2 overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${program.share}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          {activeTab === "leads" && (
            <motion.div key="leads" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-card rounded-2xl border border-border p-4">
                    <p className="text-xs text-muted-foreground">Total Leads</p>
                    <p className="text-xl font-black text-foreground mt-2">{leads.length}</p>
                  </div>
                  <div className="bg-card rounded-2xl border border-border p-4">
                    <p className="text-xs text-muted-foreground">Conversão</p>
                    <p className="text-xl font-black text-foreground mt-2">
                      {Math.round((leads.filter(l => l.status === "converted").length / leads.length) * 100)}%
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {leads.map((lead) => {
                    const status = getStatusLabel(lead.status);
                    return (
                      <div key={lead.id} className="bg-card rounded-2xl border border-border p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">{lead.name}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{lead.campaignName}</p>
                          </div>
                          <div className={`px-2 py-1 rounded-lg ${status.bg}`}>
                            <span className={`text-[10px] font-bold ${status.color}`}>{status.label}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              <Mail size={12} className="text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[9px] text-muted-foreground uppercase">E-mail</p>
                              <p className="text-[11px] font-medium truncate">{lead.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              <Phone size={12} className="text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[9px] text-muted-foreground uppercase">Telefone</p>
                              <p className="text-[11px] font-medium truncate">{lead.phone}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-border/50">
                          <span className="text-[10px] text-muted-foreground">{lead.date}</span>
                          <div className="flex gap-1.5">
                            <button 
                              onClick={() => handleUpdateLeadStatus(lead.id, "contacted")}
                              className={`h-8 px-2.5 rounded-lg border text-[10px] font-bold transition-all ${
                                lead.status === "contacted" 
                                  ? "bg-amber-500 border-amber-500 text-white" 
                                  : "border-border text-muted-foreground hover:border-amber-500/50"
                              }`}
                            >
                              Contato
                            </button>
                            <button 
                              onClick={() => handleUpdateLeadStatus(lead.id, "converted")}
                              className={`h-8 px-2.5 rounded-lg border text-[10px] font-bold transition-all ${
                                lead.status === "converted" 
                                  ? "bg-emerald-500 border-emerald-500 text-white" 
                                  : "border-border text-muted-foreground hover:border-emerald-500/50"
                              }`}
                            >
                              Converter
                            </button>
                            {lead.status === "new" && (
                              <button 
                                onClick={() => handleUpdateLeadStatus(lead.id, "lost")}
                                className="h-8 px-2.5 rounded-lg border border-border text-[10px] font-bold text-muted-foreground hover:border-rose-500/50"
                              >
                                Perder
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "company" && (
            <motion.div key="company" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="p-4 space-y-4">
                <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground">Empresa</label>
                    <input
                      className="mt-1 w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                      value={companyProfile.name}
                      onChange={(event) => setCompanyProfile((prev) => ({ ...prev, name: event.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Contato</label>
                    <input
                      className="mt-1 w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                      value={companyProfile.contact}
                      onChange={(event) => setCompanyProfile((prev) => ({ ...prev, contact: event.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground">Telefone</label>
                      <input
                        className="mt-1 w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                        value={companyProfile.phone}
                        onChange={(event) => setCompanyProfile((prev) => ({ ...prev, phone: event.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Cidade</label>
                      <input
                        className="mt-1 w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                        value={companyProfile.city}
                        onChange={(event) => setCompanyProfile((prev) => ({ ...prev, city: event.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Site</label>
                    <input
                      className="mt-1 w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                      value={companyProfile.website}
                      onChange={(event) => setCompanyProfile((prev) => ({ ...prev, website: event.target.value }))}
                    />
                  </div>
                </div>
                <div className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Identidade visual</p>
                    <p className="text-[10px] text-muted-foreground">Logo e cor principal</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-black">AM</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        onClick={() => handleCreateCampaign()}
        className="fixed bottom-24 right-5 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-[0_8px_24px_hsl(var(--primary)/0.4)] flex items-center justify-center"
        title="Criar campanha"
      >
        <Plus size={22} />
      </button>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2.5rem)] max-w-[22rem]">
        <nav className="flex items-center justify-around bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl py-2.5 px-4 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-[0_4px_16px_hsl(var(--primary)/0.4)] scale-110"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {isActive ? (
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
                    <Icon size={20} strokeWidth={2.5} />
                  </motion.div>
                ) : (
                  <Icon size={20} strokeWidth={1.5} />
                )}
                {tab.id === "leads" && leads.some(l => l.status === "new") && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 border-2 border-background" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default AdvertiserDashboard;
