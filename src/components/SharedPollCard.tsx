import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Vote, Check, Users, Share2, TrendingUp } from "lucide-react";
import { type PesquisaIntencao, cargoLabels } from "@/data/politicians";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(220 70% 50%)",
  "hsl(340 75% 55%)",
  "hsl(160 60% 45%)",
  "hsl(30 80% 55%)",
  "hsl(280 65% 60%)",
];

const SharedPollCard = ({ pesquisa }: { pesquisa: PesquisaIntencao }) => {
  const storageKey = `beep_shared_vote_${pesquisa.id}`;

  const [voted, setVoted] = useState<string | null>(() => localStorage.getItem(storageKey));
  const [showResults, setShowResults] = useState(!!localStorage.getItem(storageKey));

  const votes = useMemo(() => {
    const v = { ...pesquisa.votos };
    if (voted) v[voted] = (v[voted] || 0) + 1;
    return v;
  }, [voted, pesquisa.votos]);

  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);

  const handleVote = (candidatoId: string) => {
    if (voted) return;
    setVoted(candidatoId);
    localStorage.setItem(storageKey, candidatoId);

    // Also update the poll's vote count in shared storage
    const shared: PesquisaIntencao[] = JSON.parse(localStorage.getItem("beep_shared_polls") || "[]");
    const idx = shared.findIndex((p) => p.id === pesquisa.id);
    if (idx >= 0) {
      shared[idx].votos[candidatoId] = (shared[idx].votos[candidatoId] || 0) + 1;
      localStorage.setItem("beep_shared_polls", JSON.stringify(shared));
    }

    setTimeout(() => setShowResults(true), 500);
  };

  const sorted = [...pesquisa.candidatos].sort((a, b) => (votes[b.id] || 0) - (votes[a.id] || 0));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-5 mt-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_4px_1.5px_hsl(var(--primary)/0.4)]"
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
            transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
          />
          <h3 className="font-bold text-sm text-foreground">Pesquisa Compartilhada</h3>
        </div>
        <span className="text-[9px] font-bold text-primary bg-primary/15 rounded-full px-2 py-0.5">
          <Share2 size={8} className="inline mr-0.5" />
          Compartilhada
        </span>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4 overflow-hidden">
        {/* Question */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Vote size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{pesquisa.titulo}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {cargoLabels[pesquisa.cargo]} · {pesquisa.regiao}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Users size={11} className="text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">
                {totalVotes.toLocaleString("pt-BR")} votos
              </span>
              {voted && (
                <span className="text-[9px] font-semibold text-primary bg-primary/15 rounded-full px-1.5 py-0.5">
                  ✓ Você votou
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Voting / Results */}
        <AnimatePresence mode="wait">
          {!showResults ? (
            <motion.div key="options" className="space-y-2">
              {pesquisa.candidatos.map((c, i) => {
                const isSelected = voted === c.id;
                return (
                  <motion.button
                    key={c.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleVote(c.id)}
                    disabled={!!voted}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all active:scale-[0.98] ${
                      isSelected
                        ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                        : voted
                          ? "border-border bg-muted/30 opacity-50"
                          : "border-border bg-background hover:bg-muted/50 hover:border-primary/30"
                    }`}
                  >
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{c.nome}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {c.partido} · Nº {c.numero}
                      </p>
                    </div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                      >
                        <Check size={14} className="text-primary-foreground" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {sorted.map((c, i) => {
                const pct = totalVotes > 0 ? ((votes[c.id] || 0) / totalVotes) * 100 : 0;
                const isUserVote = voted === c.id;
                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                        <span className={`text-xs font-semibold ${isUserVote ? "text-primary" : "text-foreground"}`}>
                          {c.nome}
                        </span>
                        <span className="text-[9px] text-muted-foreground">{c.partido}</span>
                        {isUserVote && <span className="text-[8px] text-primary">← seu voto</span>}
                        {i === 0 && (
                          <span className="text-[8px] font-bold text-primary bg-primary/15 rounded-full px-1.5 py-0.5">
                            🏆 Líder
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-foreground">{pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: i * 0.1 + 0.2, duration: 0.8 }}
                      />
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      {(votes[c.id] || 0).toLocaleString("pt-BR")} votos
                    </p>
                  </motion.div>
                );
              })}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-3 pt-3 border-t border-border flex items-center gap-2"
              >
                <TrendingUp size={12} className="text-primary" />
                <p className="text-[10px] text-muted-foreground">
                  Período: {pesquisa.dataInicio} a {pesquisa.dataFim}
                </p>
              </motion.div>

              <button
                onClick={() => {
                  localStorage.removeItem(storageKey);
                  setVoted(null);
                  setShowResults(false);
                }}
                className="text-[10px] text-primary font-semibold mt-1"
              >
                Votar novamente
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default SharedPollCard;
