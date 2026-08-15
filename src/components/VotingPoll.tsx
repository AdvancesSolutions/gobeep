import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Vote, Check, TrendingUp, Users, BarChart3 } from "lucide-react";

interface Candidate {
  id: string;
  name: string;
  party: string;
  emoji: string;
  color: string;
}

const candidates: Candidate[] = [
  { id: "c1", name: "Ana Oliveira", party: "PSD", emoji: "🟦", color: "hsl(var(--primary))" },
  { id: "c2", name: "Carlos Mendes", party: "PT", emoji: "🟥", color: "hsl(0 70% 50%)" },
  { id: "c3", name: "Beatriz Santos", party: "MDB", emoji: "🟩", color: "hsl(140 60% 40%)" },
  { id: "c4", name: "Roberto Lima", party: "PL", emoji: "🟨", color: "hsl(45 90% 50%)" },
  { id: "c5", name: "Branco / Nulo", party: "", emoji: "⬜", color: "hsl(var(--muted-foreground))" },
];

// Simulated existing votes
const baseVotes: Record<string, number> = {
  c1: 3420,
  c2: 2890,
  c3: 1950,
  c4: 1680,
  c5: 460,
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, type: "spring", stiffness: 300, damping: 26 },
  }),
};

const VotingPoll = () => {
  const [voted, setVoted] = useState<string | null>(() => {
    return localStorage.getItem("beep_vote_2026");
  });
  const [showResults, setShowResults] = useState(!!localStorage.getItem("beep_vote_2026"));

  const interests = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("beep_interests") || "[]") as string[];
    } catch {
      return [];
    }
  }, []);

  const votes = useMemo(() => {
    const v = { ...baseVotes };
    if (voted) v[voted] = (v[voted] || 0) + 1;
    return v;
  }, [voted]);

  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);

  if (!interests.includes("politica")) return null;

  const handleVote = (id: string) => {
    if (voted) return;
    setVoted(id);
    localStorage.setItem("beep_vote_2026", id);
    setTimeout(() => setShowResults(true), 600);
  };

  const sorted = [...candidates].sort((a, b) => (votes[b.id] || 0) - (votes[a.id] || 0));

  return (
    <motion.div
      className="px-5 mt-6"
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }}
    >
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-destructive shadow-[0_0_4px_1.5px_hsl(var(--destructive)/0.4)]"
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
            transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, delay: 0.7 }}
          />
          <h3 className="font-bold text-sm text-foreground">Pesquisa de Intenção de Voto</h3>
        </div>
        <span className="text-[9px] font-bold text-destructive bg-destructive/15 rounded-full px-2 py-0.5">🗳️ 2026</span>
      </motion.div>

      {/* Poll card */}
      <motion.div
        variants={fadeUp}
        custom={1}
        className="bg-card rounded-2xl border border-border p-4 overflow-hidden"
      >
        {/* Question */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-destructive/15 flex items-center justify-center shrink-0">
            <Vote size={18} className="text-destructive" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Se as eleições fossem hoje, em quem você votaria para presidente?</p>
            <div className="flex items-center gap-2 mt-1.5">
              <Users size={11} className="text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{totalVotes.toLocaleString("pt-BR")} votos</span>
              {voted && (
                <span className="text-[9px] font-semibold text-primary bg-primary/15 rounded-full px-1.5 py-0.5">
                  ✓ Você votou
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Candidates */}
        <div className="space-y-2">
          <AnimatePresence mode="wait">
            {!showResults ? (
              <motion.div key="options" className="space-y-2">
                {candidates.map((c, i) => {
                  const isSelected = voted === c.id;
                  return (
                    <motion.button
                      key={c.id}
                      custom={i + 2}
                      variants={fadeUp}
                      initial="hidden"
                      animate="show"
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
                      <span className="text-lg">{c.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{c.name}</p>
                        {c.party && <p className="text-[10px] text-muted-foreground">{c.party}</p>}
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 15 }}
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
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
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
                      transition={{ delay: i * 0.08, type: "spring", stiffness: 300, damping: 25 }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{c.emoji}</span>
                          <span className={`text-xs font-semibold ${isUserVote ? "text-primary" : "text-foreground"}`}>
                            {c.name}
                          </span>
                          {c.party && <span className="text-[9px] text-muted-foreground">{c.party}</span>}
                          {isUserVote && <span className="text-[8px] text-primary">← seu voto</span>}
                          {i === 0 && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.4, type: "spring" }}
                              className="text-[8px] font-bold text-primary bg-primary/15 rounded-full px-1.5 py-0.5"
                            >
                              🏆 Líder
                            </motion.span>
                          )}
                        </div>
                        <span className="text-xs font-bold text-foreground">{pct.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: c.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: i * 0.1 + 0.2, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                        />
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{(votes[c.id] || 0).toLocaleString("pt-BR")} votos</p>
                    </motion.div>
                  );
                })}

                {/* Footer insights */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-3 pt-3 border-t border-border flex items-center gap-2"
                >
                  <TrendingUp size={12} className="text-primary" />
                  <p className="text-[10px] text-muted-foreground">
                    Pesquisa simulada • Dados fictícios para demonstração
                  </p>
                </motion.div>

                {/* Reset */}
                <button
                  onClick={() => {
                    localStorage.removeItem("beep_vote_2026");
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
    </motion.div>
  );
};

export default VotingPoll;
