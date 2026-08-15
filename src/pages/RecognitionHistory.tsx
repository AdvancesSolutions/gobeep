import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Radio, Music, Clock, ChevronRight, Filter, X, BarChart3, Tv } from "lucide-react";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { sessions, stations } from "@/data/stations";
import PageHeader from "@/components/PageHeader";

const stationNames = [...new Set(sessions.map((s) => s.station))];

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 30 } },
};

const RecognitionHistory = ({ onNavigate }: { onNavigate: (page: string, stationId?: string, sessionId?: number) => void }) => {
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const filtered = sessions.filter((s) => {
    if (selectedStation && s.station !== selectedStation) return false;
    if (selectedDate && s.date !== format(selectedDate, "yyyy-MM-dd")) return false;
    return true;
  });

  const hasFilters = selectedStation || selectedDate;

  const chartData = useMemo(() => {
    const byDate: Record<string, number> = {};
    filtered.forEach((s) => {
      byDate[s.date] = (byDate[s.date] || 0) + s.tracks;
    });
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, tracks]) => ({
        date: format(new Date(date), "dd/MM"),
        tracks,
      }));
  }, [filtered]);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-28">
      <PageHeader title="Histórico Rádio & TV" onBack={() => onNavigate("home")} />

      {/* Filters */}
      <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(
              "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors",
              selectedStation ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"
            )}>
              <Radio size={12} />
              {selectedStation || "Emissora"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1" align="start">
            {stationNames.map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStation(selectedStation === st ? null : st)}
                className={cn(
                  "w-full text-left text-sm px-3 py-2 rounded-lg transition-colors",
                  selectedStation === st ? "bg-primary/15 text-primary font-semibold" : "hover:bg-muted text-foreground"
                )}
              >
                {st}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(
              "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors",
              selectedDate ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"
            )}>
              <Filter size={12} />
              {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Data"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        {hasFilters && (
          <button
            onClick={() => { setSelectedStation(null); setSelectedDate(undefined); }}
            className="flex items-center gap-1 text-xs text-destructive font-medium px-2 py-1.5"
          >
            <X size={12} /> Limpar
          </button>
        )}
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-around px-4 py-4 border-b border-border">
        <div className="text-center">
          <p className="text-xl font-extrabold text-foreground">{filtered.length}</p>
          <p className="text-[11px] text-muted-foreground font-medium">Sessões</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-extrabold text-foreground">{filtered.reduce((a, s) => a + s.tracks, 0)}</p>
          <p className="text-[11px] text-muted-foreground font-medium">Faixas</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-extrabold text-foreground">{new Set(filtered.map((s) => s.station)).size}</p>
          <p className="text-[11px] text-muted-foreground font-medium">Emissoras</p>
        </div>
      </div>

      {/* Bar Chart */}
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="px-4 pt-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={14} className="text-primary" />
            <p className="text-xs font-semibold text-foreground">Faixas por dia</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-3">
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={chartData} barCategoryGap="20%">
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  width={24}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                />
                <Bar dataKey="tracks" radius={[6, 6, 0, 0]} fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Session list */}
      <motion.div className="px-4 pt-4 pb-4 space-y-3 flex-1" variants={containerVariants} initial="hidden" animate="show">
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">Nenhuma sessão encontrada.</p>
        )}
        {filtered.map((session) => {
          const stationData = stations.find((s) => s.id === session.stationId);
          const Icon = session.type === "tv" ? Tv : Radio;
          return (
            <motion.button
              key={session.id}
              variants={itemVariants}
              onClick={() => onNavigate("detail", session.stationId, session.id)}
              className="w-full flex items-center gap-3 p-4 bg-card rounded-2xl border border-border text-left transition-colors hover:bg-muted/50 active:scale-[0.98]"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Icon size={20} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">{session.station}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-muted-foreground">{session.freq}</span>
                  <span className="text-[11px] text-muted-foreground">•</span>
                  <span className="text-[11px] text-muted-foreground">{format(new Date(session.date), "MMM dd, yyyy")}</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Music size={10} /> {session.tracks} faixas</span>
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Clock size={10} /> {session.duration}</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-muted-foreground shrink-0" />
            </motion.button>
          );
        })}
      </motion.div>

      <div className="h-24" />
    </div>
  );
};

export default RecognitionHistory;
