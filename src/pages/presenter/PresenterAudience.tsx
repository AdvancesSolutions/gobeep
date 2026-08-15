import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Users, Eye, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { type TvProgram } from "@/data/broadcasters";
import { generateProgramTimeline } from "@/data/presenter";

interface Props {
  programs: TvProgram[];
}

const PresenterAudience = ({ programs }: Props) => {
  const mainProgram = programs[0];
  const timeline = mainProgram ? generateProgramTimeline(mainProgram.id) : [];

  const stats = mainProgram
    ? [
        { label: "Ao vivo agora", value: `${mainProgram.currentAudience}%`, icon: Eye, trend: mainProgram.currentAudience > mainProgram.avgAudience ? "up" : "down" },
        { label: "Média", value: `${mainProgram.avgAudience}%`, icon: Users, trend: null },
        { label: "Pico", value: `${mainProgram.peakAudience}%`, icon: TrendingUp, trend: "up" },
        { label: "Status", value: mainProgram.status === "ao-vivo" ? "AO VIVO" : mainProgram.status.toUpperCase(), icon: Clock, trend: null },
      ]
    : [];

  return (
    <div className="px-4 pt-4 space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-card rounded-2xl border border-border p-3.5"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
                  <Icon size={16} className="text-primary" />
                </div>
                {stat.trend === "up" && <TrendingUp size={14} className="text-green-500 ml-auto" />}
                {stat.trend === "down" && <TrendingDown size={14} className="text-destructive ml-auto" />}
              </div>
              <p className="text-xl font-black text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground font-medium">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Audience Chart */}
      {mainProgram && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl border border-border p-4"
        >
          <h3 className="text-sm font-bold text-foreground mb-1">{mainProgram.name}</h3>
          <p className="text-[10px] text-muted-foreground mb-3">Audiência em tempo real</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline}>
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval={3} />
                <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={30} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Line type="monotone" dataKey="audience" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Other programs */}
      {programs.length > 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Outros Programas</h3>
          <div className="space-y-2">
            {programs.slice(1).map((p) => (
              <div key={p.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">{p.startTime} - {p.endTime}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-foreground">{p.currentAudience}%</p>
                  <p className="text-[10px] text-muted-foreground">audiência</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {programs.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm">Nenhum programa encontrado para este apresentador.</p>
        </div>
      )}
    </div>
  );
};

export default PresenterAudience;
