import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Users, TrendingUp, Clock, DollarSign, Calendar, Tv } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { type Broadcaster, broadcasters, programs } from "@/data/broadcasters";

const ProgramDetail = ({
  programId,
  broadcaster,
  onBack,
}: {
  programId: string;
  broadcaster: Broadcaster;
  onBack: () => void;
}) => {
  const program = useMemo(() => programs.find((p) => p.id === programId), [programId]);

  if (!program) return null;

  const ownerBroadcaster = broadcasters.find((b) => b.id === program.broadcasterId) || broadcaster;
  const isOwn = program.broadcasterId === broadcaster.id;

  // Mock weekly audience data
  const weekData = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day) => ({
    day,
    audience: +(program.avgAudience + (Math.random() - 0.5) * 6).toFixed(1),
  }));

  const adRevenue = program.adSlotsSold * program.adPricePerSlot;
  const adFillRate = ((program.adSlotsSold / program.adSlotsTotal) * 100).toFixed(0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card-dark px-4 pt-10 pb-5" style={{ borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <button onClick={onBack} className="flex items-center gap-2 text-card-dark-foreground/60 mb-4">
          <ArrowLeft size={16} />
          <span className="text-xs font-medium">Voltar</span>
        </button>

        <div className="flex items-start gap-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: `${ownerBroadcaster.color}20` }}
          >
            <Tv size={24} style={{ color: ownerBroadcaster.color }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-card-dark-foreground">{program.name}</h1>
              {program.status === "ao-vivo" && (
                <span className="text-[9px] font-bold text-green-400 bg-green-500/15 rounded-full px-2 py-0.5">
                  🔴 AO VIVO
                </span>
              )}
            </div>
            <p className="text-xs text-card-dark-foreground/50 mt-0.5">
              {ownerBroadcaster.name} • {program.genre} • {program.host}
            </p>
            {!isOwn && (
              <span className="text-[9px] font-bold text-primary bg-primary/20 rounded-full px-2 py-0.5 mt-1 inline-block">
                Concorrente
              </span>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex gap-3 mt-4">
          {[
            { label: "Atual", value: `${program.currentAudience} pts`, icon: Users },
            { label: "Média", value: `${program.avgAudience} pts`, icon: TrendingUp },
            { label: "Pico", value: `${program.peakAudience} pts`, icon: TrendingUp },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex-1 p-2.5 rounded-xl bg-card-dark-foreground/8 text-center"
            >
              <s.icon size={12} className="text-card-dark-foreground/40 mx-auto mb-1" />
              <p className="text-sm font-bold text-card-dark-foreground">{s.value}</p>
              <p className="text-[9px] text-card-dark-foreground/40">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Description */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card rounded-xl border border-border p-4"
        >
          <h3 className="text-xs font-bold text-foreground mb-2">Sobre o Programa</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{program.description}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock size={10} /> {program.startTime} — {program.endTime}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Calendar size={10} /> {program.daysOfWeek.join(", ")}
            </div>
          </div>
        </motion.div>

        {/* Weekly audience chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-border p-4"
        >
          <h3 className="text-xs font-bold text-foreground mb-3">📊 Audiência Semanal</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={30} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                />
                <Bar dataKey="audience" name="Audiência" fill={ownerBroadcaster.color} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Ad slots info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl border border-border p-4"
        >
          <h3 className="text-xs font-bold text-foreground mb-3">💰 Espaço Publicitário</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-lg font-black text-foreground">{program.adSlotsSold}/{program.adSlotsTotal}</p>
              <p className="text-[9px] text-muted-foreground">Slots Vendidos</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-lg font-black text-foreground">{adFillRate}%</p>
              <p className="text-[9px] text-muted-foreground">Taxa Ocupação</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-sm font-bold text-foreground">R$ {(program.adPricePerSlot / 1000).toFixed(0)}K</p>
              <p className="text-[9px] text-muted-foreground">Preço/Slot</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-sm font-bold text-green-600">R$ {(adRevenue / 1e6).toFixed(1)}M</p>
              <p className="text-[9px] text-muted-foreground">Receita Total</p>
            </div>
          </div>

          {program.adSlotsTotal - program.adSlotsSold > 0 && (
            <div className="mt-3 p-2.5 bg-primary/10 rounded-lg flex items-center gap-2">
              <DollarSign size={14} className="text-primary" />
              <p className="text-[10px] text-foreground">
                <span className="font-bold">{program.adSlotsTotal - program.adSlotsSold} slots disponíveis</span> para anúncios
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ProgramDetail;
