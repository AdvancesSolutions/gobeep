import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Tv, Users, ChevronRight } from "lucide-react";
import {
  type Broadcaster,
  broadcasters,
  getBroadcasterPrograms,
  getCompetitorPrograms,
} from "@/data/broadcasters";

const ProgramsList = ({
  broadcaster,
  onSelectProgram,
}: {
  broadcaster: Broadcaster;
  onSelectProgram: (id: string) => void;
}) => {
  const [viewMode, setViewMode] = useState<"mine" | "competitors">("mine");

  const myPrograms = useMemo(() => getBroadcasterPrograms(broadcaster.id), [broadcaster.id]);
  const competitorPrograms = useMemo(() => getCompetitorPrograms(broadcaster.id), [broadcaster.id]);

  const programs = viewMode === "mine" ? myPrograms : competitorPrograms;

  // Group competitors by broadcaster
  const grouped = useMemo(() => {
    if (viewMode === "mine") return { [broadcaster.id]: myPrograms };
    const g: Record<string, typeof programs> = {};
    competitorPrograms.forEach((p) => {
      if (!g[p.broadcasterId]) g[p.broadcasterId] = [];
      g[p.broadcasterId].push(p);
    });
    return g;
  }, [viewMode, broadcaster.id, myPrograms, competitorPrograms]);

  return (
    <div className="px-4 pt-4 space-y-4">
      {/* Toggle */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl">
        {[
          { id: "mine" as const, label: `${broadcaster.shortName}` },
          { id: "competitors" as const, label: "Concorrentes" },
        ].map((mode) => (
          <button
            key={mode.id}
            onClick={() => setViewMode(mode.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              viewMode === mode.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Programs */}
      {Object.entries(grouped).map(([bId, progs]) => {
        const b = broadcasters.find((x) => x.id === bId)!;
        return (
          <motion.div
            key={bId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            {viewMode === "competitors" && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-lg">{b.logo}</span>
                <h3 className="text-xs font-bold text-foreground">{b.name}</h3>
              </div>
            )}

            {progs
              .sort((a, b) => b.currentAudience - a.currentAudience)
              .map((p, i) => (
                <motion.button
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => onSelectProgram(p.id)}
                  className="w-full flex items-center gap-3 p-3 bg-card rounded-xl border border-border text-left active:scale-[0.98] transition-all"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${b.color}15` }}
                  >
                    <Tv size={18} style={{ color: b.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-foreground truncate">{p.name}</p>
                      {p.status === "ao-vivo" && (
                        <span className="text-[8px] font-bold text-green-600 bg-green-500/15 rounded-full px-1.5 py-0.5">
                          🔴 VIVO
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {p.host} • {p.startTime}–{p.endTime} • {p.genre}
                    </p>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <div className="flex items-center gap-1 justify-end">
                        <Users size={10} className="text-muted-foreground" />
                        <p className="text-xs font-bold text-foreground">{p.currentAudience}</p>
                      </div>
                      <p className="text-[9px] text-muted-foreground">pts</p>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground" />
                  </div>
                </motion.button>
              ))}
          </motion.div>
        );
      })}
    </div>
  );
};

export default ProgramsList;
