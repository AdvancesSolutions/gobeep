import { useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, DollarSign, CheckCircle, AlertCircle } from "lucide-react";
import { type Broadcaster, getBroadcasterPrograms } from "@/data/broadcasters";

const timeSlots = [
  "04:00", "05:00", "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
  "20:00", "21:00", "22:00", "23:00", "00:00",
];

const ScheduleGrid = ({ broadcaster }: { broadcaster: Broadcaster }) => {
  const programs = useMemo(() => getBroadcasterPrograms(broadcaster.id), [broadcaster.id]);

  const getSlotProgram = (time: string) => {
    const [h] = time.split(":").map(Number);
    return programs.find((p) => {
      const [sh] = p.startTime.split(":").map(Number);
      const [eh] = p.endTime.split(":").map(Number);
      const end = eh === 0 ? 24 : eh;
      return h >= sh && h < end;
    });
  };

  const totalSlots = programs.reduce((s, p) => s + p.adSlotsTotal, 0);
  const soldSlots = programs.reduce((s, p) => s + p.adSlotsSold, 0);
  const availableSlots = totalSlots - soldSlots;
  const totalRevenue = programs.reduce((s, p) => s + p.adSlotsSold * p.adPricePerSlot, 0);

  return (
    <div className="px-4 pt-4 space-y-4">
      {/* Ad summary */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Slots Vendidos", value: `${soldSlots}/${totalSlots}`, icon: CheckCircle, color: "text-green-500" },
          { label: "Disponíveis", value: String(availableSlots), icon: AlertCircle, color: "text-primary" },
          { label: "Receita Total", value: `R$ ${(totalRevenue / 1e6).toFixed(1)}M`, icon: DollarSign, color: "text-green-500" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="p-3 bg-card rounded-xl border border-border text-center"
          >
            <s.icon size={16} className={`${s.color} mx-auto mb-1`} />
            <p className="text-sm font-bold text-foreground">{s.value}</p>
            <p className="text-[9px] text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Schedule timeline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-xl border border-border overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Clock size={14} className="text-primary" />
          <h3 className="text-xs font-bold text-foreground">Grade Horária — Hoje</h3>
        </div>

        <div className="divide-y divide-border">
          {timeSlots.map((time, i) => {
            const prog = getSlotProgram(time);
            const isStart = prog?.startTime === time;
            const adFillPct = prog ? (prog.adSlotsSold / prog.adSlotsTotal) * 100 : 0;
            const availableAds = prog ? prog.adSlotsTotal - prog.adSlotsSold : 0;

            return (
              <motion.div
                key={time}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className={`flex items-stretch ${isStart ? "bg-primary/5" : ""}`}
              >
                {/* Time label */}
                <div className="w-14 shrink-0 py-2.5 px-3 border-r border-border flex items-center">
                  <span className="text-[10px] font-mono font-bold text-muted-foreground">{time}</span>
                </div>

                {/* Content */}
                <div className="flex-1 py-2.5 px-3">
                  {prog ? (
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`text-xs font-semibold ${isStart ? "text-primary" : "text-foreground"}`}>
                          {prog.name}
                        </p>
                        {isStart && (
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                            prog.status === "ao-vivo" ? "bg-green-500/15 text-green-600" : "bg-muted text-muted-foreground"
                          }`}>
                            {prog.status === "ao-vivo" ? "🔴 VIVO" : prog.status.toUpperCase()}
                          </span>
                        )}
                      </div>
                      {isStart && (
                        <div className="mt-1.5 flex items-center gap-3">
                          <span className="text-[9px] text-muted-foreground">
                            {prog.startTime}–{prog.endTime}
                          </span>
                          <span className="text-[9px] text-muted-foreground">
                            {prog.genre}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground italic">Sem programação</p>
                  )}
                </div>

                {/* Ad slots */}
                <div className="w-24 shrink-0 py-2.5 px-2 border-l border-border flex flex-col items-end justify-center">
                  {prog && isStart ? (
                    <>
                      <div className="h-1 w-full bg-muted rounded-full overflow-hidden mb-1">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${adFillPct}%`,
                            background: adFillPct === 100 ? "hsl(var(--destructive))" : broadcaster.color,
                          }}
                        />
                      </div>
                      <span className={`text-[8px] font-bold ${availableAds > 0 ? "text-green-600" : "text-destructive"}`}>
                        {availableAds > 0 ? `${availableAds} vagas` : "Esgotado"}
                      </span>
                      <span className="text-[8px] text-muted-foreground">
                        R$ {(prog.adPricePerSlot / 1000).toFixed(0)}K/slot
                      </span>
                    </>
                  ) : null}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default ScheduleGrid;
