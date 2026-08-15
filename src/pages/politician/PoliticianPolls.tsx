import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, Clock, CheckCircle2, FileEdit, PieChart, TrendingUp, Share2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { type GabineteProfile, type PesquisaIntencao, cargoLabels } from "@/data/politicians";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const statusConfig = {
  ativa: { label: "Ativa", icon: Clock, color: "text-green-500 bg-green-500/10" },
  encerrada: { label: "Encerrada", icon: CheckCircle2, color: "text-muted-foreground bg-muted" },
  rascunho: { label: "Rascunho", icon: FileEdit, color: "text-yellow-500 bg-yellow-500/10" },
};

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 220 70% 50%))",
  "hsl(var(--chart-3, 340 75% 55%))",
  "hsl(var(--chart-4, 160 60% 45%))",
  "hsl(var(--chart-5, 30 80% 55%))",
  "hsl(280 65% 60%)",
  "hsl(200 70% 50%)",
  "hsl(50 90% 50%)",
];

const PoliticianPolls = ({ gabinete }: { gabinete: GabineteProfile }) => {
  const [pesquisas, setPesquisas] = useState<PesquisaIntencao[]>([]);
  const [selectedPesquisa, setSelectedPesquisa] = useState<PesquisaIntencao | null>(null);
  const [chartView, setChartView] = useState<"bars" | "pie" | "line">("bars");

  useEffect(() => {
    const saved = localStorage.getItem("beep_pesquisas");
    if (saved) setPesquisas(JSON.parse(saved));
  }, []);

  const handleSharePoll = (pesquisa: PesquisaIntencao) => {
    const shared: PesquisaIntencao[] = JSON.parse(localStorage.getItem("beep_shared_polls") || "[]");
    const alreadyShared = shared.some((p) => p.id === pesquisa.id);
    if (!alreadyShared) {
      shared.push(pesquisa);
      localStorage.setItem("beep_shared_polls", JSON.stringify(shared));
    }
    // Copy a shareable "link" to clipboard
    const shareText = `🗳️ Vote na pesquisa "${pesquisa.titulo}" no Beep! ID: ${pesquisa.id}`;
    navigator.clipboard.writeText(shareText).then(() => {
      toast.success("Pesquisa compartilhada!", {
        description: alreadyShared
          ? "Link copiado. A pesquisa já está disponível para votação."
          : "Link copiado e pesquisa disponibilizada para votação no app.",
      });
    }).catch(() => {
      toast.success(alreadyShared ? "Pesquisa já compartilhada!" : "Pesquisa disponibilizada para votação!");
    });
  };

  if (selectedPesquisa) {
    const totalVotos = Object.values(selectedPesquisa.votos).reduce((a, b) => a + b, 0);

    const pieData = selectedPesquisa.candidatos.map((c) => ({
      name: c.nome,
      value: selectedPesquisa.votos[c.id] || 0,
      partido: c.partido,
    }));

    // Simulate timeline data for line chart
    const lineData = generateTimelineData(selectedPesquisa);

    const chartConfig: ChartConfig = {};
    selectedPesquisa.candidatos.forEach((c, i) => {
      chartConfig[c.nome] = {
        label: `${c.nome} (${c.partido})`,
        color: CHART_COLORS[i % CHART_COLORS.length],
      };
    });

    return (
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setSelectedPesquisa(null)} className="text-sm text-primary font-semibold">← Voltar</button>
          {selectedPesquisa.status === "ativa" && (
            <button
              onClick={() => handleSharePoll(selectedPesquisa)}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
            >
              <Share2 size={12} />
              Compartilhar
            </button>
          )}
        </div>
        <h2 className="text-lg font-black text-foreground mb-1">{selectedPesquisa.titulo}</h2>
        <p className="text-xs text-muted-foreground mb-4">{cargoLabels[selectedPesquisa.cargo]} · {selectedPesquisa.regiao}</p>

        {/* Chart View Toggle */}
        <div className="flex gap-1 bg-muted rounded-xl p-1 mb-4">
          {[
            { id: "bars" as const, label: "Barras", icon: BarChart3 },
            { id: "pie" as const, label: "Pizza", icon: PieChart },
            { id: "line" as const, label: "Evolução", icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setChartView(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                chartView === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon size={12} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Bar View */}
        {chartView === "bars" && (
          <div className="space-y-3">
            {selectedPesquisa.candidatos.map((c) => {
              const votos = selectedPesquisa.votos[c.id] || 0;
              const pct = totalVotos > 0 ? (votos / totalVotos) * 100 : 0;
              return (
                <motion.div key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="bg-card rounded-xl p-4 border border-border">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{c.nome}</p>
                      <p className="text-xs text-muted-foreground">{c.partido} · Nº {c.numero}</p>
                    </div>
                    <span className="text-lg font-black text-primary">{pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-primary rounded-full"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{votos} votos</p>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pie Chart */}
        {chartView === "pie" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-xl p-4 border border-border">
            <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[280px]">
              <RechartsPie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={40}
                  strokeWidth={2}
                  stroke="hsl(var(--background))"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
              </RechartsPie>
            </ChartContainer>
            <div className="mt-3 space-y-1.5">
              {pieData.map((d, i) => {
                const pct = totalVotos > 0 ? ((d.value / totalVotos) * 100).toFixed(1) : "0";
                return (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-foreground font-medium">{d.name}</span>
                      <span className="text-muted-foreground">({d.partido})</span>
                    </div>
                    <span className="font-bold text-foreground">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Line Chart */}
        {chartView === "line" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-xl p-4 border border-border">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Evolução ao longo do tempo</p>
            <ChartContainer config={chartConfig} className="aspect-video max-h-[260px]">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="period" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                {selectedPesquisa.candidatos.map((c, i) => (
                  <Line
                    key={c.id}
                    type="monotone"
                    dataKey={c.nome}
                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3, fill: CHART_COLORS[i % CHART_COLORS.length] }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ChartContainer>
            <div className="mt-3 flex flex-wrap gap-3">
              {selectedPesquisa.candidatos.map((c, i) => (
                <div key={c.id} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-foreground font-medium">{c.nome}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="mt-4 p-3 bg-muted rounded-xl">
          <p className="text-xs text-muted-foreground">Total de votos: <span className="font-bold text-foreground">{totalVotos}</span></p>
          <p className="text-xs text-muted-foreground">Período: {selectedPesquisa.dataInicio} a {selectedPesquisa.dataFim}</p>
        </div>
      </div>
    );
  }

  if (pesquisas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <BarChart3 size={28} className="text-muted-foreground" />
        </div>
        <h3 className="font-bold text-foreground mb-1">Nenhuma pesquisa</h3>
        <p className="text-sm text-muted-foreground">Crie sua primeira pesquisa de intenção de votos na aba "Nova".</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 space-y-3">
      <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Suas Pesquisas</h2>
      {pesquisas.map((p, i) => {
        const cfg = statusConfig[p.status];
        const Icon = cfg.icon;
        const totalVotos = Object.values(p.votos).reduce((a, b) => a + b, 0);
        return (
          <motion.button
            key={p.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setSelectedPesquisa(p)}
            className="w-full text-left bg-card rounded-xl p-4 border border-border hover:border-primary/30 transition-all"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-foreground text-sm">{p.titulo}</h3>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${cfg.color}`}>
                <Icon size={10} />
                {cfg.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{cargoLabels[p.cargo]} · {p.regiao}</p>
            <p className="text-xs text-muted-foreground mt-1">{p.candidatos.length} candidatos · {totalVotos} votos</p>
          </motion.button>
        );
      })}
    </div>
  );
};

/** Generate simulated timeline data based on poll dates */
function generateTimelineData(pesquisa: PesquisaIntencao) {
  const periods = ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5"];
  const totalVotos = Object.values(pesquisa.votos).reduce((a, b) => a + b, 0);

  return periods.map((period, pi) => {
    const point: Record<string, string | number> = { period };
    pesquisa.candidatos.forEach((c) => {
      const finalVotos = pesquisa.votos[c.id] || 0;
      const finalPct = totalVotos > 0 ? (finalVotos / totalVotos) * 100 : 0;
      // Simulate progression toward final percentage
      const variance = (Math.sin(pi * 1.5 + c.nome.length) * 8);
      const progression = 0.5 + (pi / (periods.length - 1)) * 0.5;
      const value = Math.max(0, Math.round(finalPct * progression + variance * (1 - progression)));
      point[c.nome] = value;
    });
    return point;
  });
}

export default PoliticianPolls;
