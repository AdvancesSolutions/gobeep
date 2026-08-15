import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Users, Trophy, Tv } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import {
  type Broadcaster,
  broadcasters,
  getBroadcasterPrograms,
  getAudienceRanking,
  generateAudienceTimeline,
} from "@/data/broadcasters";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, type: "spring", stiffness: 300, damping: 26 },
  }),
};

const DashboardOverview = ({ broadcaster }: { broadcaster: Broadcaster }) => {
  const myPrograms = useMemo(() => getBroadcasterPrograms(broadcaster.id), [broadcaster.id]);
  const ranking = useMemo(() => getAudienceRanking(), []);
  const timeline = useMemo(() => generateAudienceTimeline(), []);
  const myRank = ranking.findIndex((r) => r.id === broadcaster.id) + 1;

  const avgAudience = myPrograms.length
    ? +(myPrograms.reduce((s, p) => s + p.currentAudience, 0) / myPrograms.length).toFixed(1)
    : 0;

  const totalAdRevenue = myPrograms.reduce((s, p) => s + p.adSlotsSold * p.adPricePerSlot, 0);
  const liveCount = myPrograms.filter((p) => p.status === "ao-vivo").length;

  // Show only every 2h in timeline for readability
  const chartData = timeline.filter((_, i) => i % 4 === 0);

  const broadcasterColors: Record<string, string> = {};
  broadcasters.forEach((b) => { broadcasterColors[b.id] = b.color; });

  return (
    <div className="px-4 pt-4 space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Audiência Média", value: `${avgAudience} pts`, icon: Users, trend: "+2.3%", up: true },
          { label: "Ranking Geral", value: `${myRank}º lugar`, icon: Trophy, trend: myRank <= 2 ? "Top 2" : `de ${broadcasters.length}`, up: myRank <= 2 },
          { label: "Ao Vivo Agora", value: `${liveCount} prog.`, icon: Tv, trend: `de ${myPrograms.length}`, up: true },
          { label: "Receita Anúncios", value: `R$ ${(totalAdRevenue / 1e6).toFixed(1)}M`, icon: TrendingUp, trend: "+8.5%", up: true },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="p-3 bg-card rounded-xl border border-border"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                <kpi.icon size={14} className="text-primary" />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">{kpi.label}</span>
            </div>
            <p className="text-lg font-black text-foreground">{kpi.value}</p>
            <div className="flex items-center gap-1 mt-1">
              {kpi.up ? <TrendingUp size={10} className="text-green-500" /> : <TrendingDown size={10} className="text-destructive" />}
              <span className={`text-[10px] font-semibold ${kpi.up ? "text-green-500" : "text-destructive"}`}>{kpi.trend}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Audience Chart */}
      <motion.div
        custom={4}
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="bg-card rounded-xl border border-border p-4"
      >
        <h3 className="text-xs font-bold text-foreground mb-3">Audiência em Tempo Real (24h)</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} width={30} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 11,
                }}
              />
              {broadcasters.map((b) => (
                <Line
                  key={b.id}
                  type="monotone"
                  dataKey={b.id}
                  name={b.shortName}
                  stroke={b.color}
                  strokeWidth={b.id === broadcaster.id ? 3 : 1.5}
                  dot={false}
                  strokeOpacity={b.id === broadcaster.id ? 1 : 0.4}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Ranking */}
      <motion.div
        custom={5}
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="bg-card rounded-xl border border-border p-4"
      >
        <h3 className="text-xs font-bold text-foreground mb-3">🏆 Ranking de Audiência</h3>
        <div className="space-y-2.5">
          {ranking.map((r, i) => {
            const isMe = r.id === broadcaster.id;
            const maxAud = ranking[0]?.avgAudience || 1;
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`flex items-center gap-3 p-2.5 rounded-xl ${isMe ? "bg-primary/10 border border-primary/20" : ""}`}
              >
                <span className={`text-sm font-black w-6 text-center ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>
                  {i + 1}º
                </span>
                <span className="text-lg">{r.logo}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold ${isMe ? "text-primary" : "text-foreground"}`}>{r.name}</p>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: r.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(r.avgAudience / maxAud) * 100}%` }}
                      transition={{ delay: i * 0.1 + 0.3, duration: 0.6 }}
                    />
                  </div>
                </div>
                <span className="text-xs font-bold text-foreground">{r.avgAudience} pts</span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Top Programs */}
      <motion.div
        custom={6}
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="bg-card rounded-xl border border-border p-4"
      >
        <h3 className="text-xs font-bold text-foreground mb-3">📺 Seus Programas — Agora</h3>
        <div className="space-y-2">
          {myPrograms
            .sort((a, b) => b.currentAudience - a.currentAudience)
            .map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-xs font-semibold text-foreground">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">{p.startTime} — {p.endTime} • {p.genre}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{p.currentAudience} pts</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    p.status === "ao-vivo" ? "bg-green-500/15 text-green-600" : "bg-muted text-muted-foreground"
                  }`}>
                    {p.status === "ao-vivo" ? "🔴 AO VIVO" : p.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardOverview;
