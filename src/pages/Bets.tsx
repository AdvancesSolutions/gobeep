import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Flame, Target, Gamepad2, Flag, Car, CircleDot, X, ChevronRight, Zap, Check } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { usePoints } from "@/contexts/PointsContext";
import { type ApostaPreditiva, type ApostaOpcao } from "@/data/politicians";

export interface UserBet {
  id: string;
  apostaId: string;
  opcaoId: string;
  valor: number;
  odd: number;
  data: string;
  status: "pendente" | "vencida" | "perdida";
  retornoPotencial: number;
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 300, damping: 26 } },
};

type Category = {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
};

const categories: Category[] = [
  { id: "futebol", label: "Futebol", icon: CircleDot, color: "bg-green-500/10 text-green-500" },
  { id: "basquete", label: "Basquete", icon: Target, color: "bg-orange-500/10 text-orange-500" },
  { id: "superball", label: "Superball", icon: Trophy, color: "bg-blue-500/10 text-blue-500" },
  { id: "formula1", label: "Fórmula 1", icon: Car, color: "bg-red-500/10 text-red-500" },
  { id: "golf", label: "Golf", icon: Flag, color: "bg-emerald-500/10 text-emerald-500" },
  { id: "games", label: "E-Sports", icon: Gamepad2, color: "bg-purple-500/10 text-purple-500" },
  { id: "politica", label: "Política", icon: Flame, color: "bg-amber-500/10 text-amber-500" },
];

type Match = {
  id: number;
  category: string;
  teamA: string;
  teamB: string;
  oddsA: number;
  oddsDraw?: number;
  oddsB: number;
  time: string;
  live?: boolean;
};

const matches: Match[] = [
  { id: 1, category: "futebol", teamA: "Benfica", teamB: "Porto", oddsA: 2.1, oddsDraw: 3.2, oddsB: 3.5, time: "Hoje, 20:00", live: true },
  { id: 2, category: "futebol", teamA: "Sporting", teamB: "Braga", oddsA: 1.8, oddsDraw: 3.5, oddsB: 4.2, time: "Amanhã, 18:30" },
  { id: 3, category: "basquete", teamA: "Lakers", teamB: "Celtics", oddsA: 1.9, oddsB: 1.95, time: "Hoje, 23:00", live: true },
  { id: 4, category: "superball", teamA: "Chiefs", teamB: "Eagles", oddsA: 1.7, oddsB: 2.2, time: "Domingo, 00:30" },
  { id: 5, category: "formula1", teamA: "Verstappen", teamB: "Hamilton", oddsA: 1.5, oddsB: 3.0, time: "Domingo, 15:00" },
  { id: 6, category: "golf", teamA: "Scheffler", teamB: "McIlroy", oddsA: 2.0, oddsB: 2.1, time: "Sábado, 14:00" },
  { id: 7, category: "games", teamA: "LOUD", teamB: "FURIA", oddsA: 1.6, oddsB: 2.4, time: "Hoje, 21:00", live: true },
  { id: 8, category: "politica", teamA: "Candidato A", teamB: "Candidato B", oddsA: 1.4, oddsB: 3.1, time: "Resultado: 15 Mar" },
  { id: 9, category: "futebol", teamA: "Real Madrid", teamB: "Barcelona", oddsA: 2.3, oddsDraw: 3.0, oddsB: 2.9, time: "Sábado, 21:00" },
  { id: 10, category: "basquete", teamA: "Warriors", teamB: "Bucks", oddsA: 2.1, oddsB: 1.8, time: "Amanhã, 01:00" },
];

const Bets = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
  const { totalPoints, removePoints } = usePoints();
  const [activeTab, setActiveTab] = useState<"explorar" | "minhas">("explorar");
  const [activeCategory, setActiveCategory] = useState("futebol");
  const [userBets, setUserBets] = useState<UserBet[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedPredictive, setSelectedPredictive] = useState<ApostaPreditiva | null>(null);
  const [selectedPredictiveOption, setSelectedPredictiveOption] = useState<ApostaOpcao | null>(null);
  const [selectedOdd, setSelectedOdd] = useState<"A" | "draw" | "B" | null>(null);
  const [betAmount, setBetAmount] = useState("");
  const [betConfirmed, setBetConfirmed] = useState(false);
  const [dynamicBets, setDynamicBets] = useState<ApostaPreditiva[]>([]);

  useEffect(() => {
    const loadData = () => {
      const savedApostas = localStorage.getItem("beep_apostas");
      if (savedApostas) {
        setDynamicBets(JSON.parse(savedApostas));
      }
      const savedUserBets = localStorage.getItem("beep_user_bets");
      if (savedUserBets) {
        setUserBets(JSON.parse(savedUserBets));
      }
    };

    loadData();
    window.addEventListener("storage", loadData);
    return () => window.removeEventListener("storage", loadData);
  }, []);

  const filteredMatches = matches.filter(m => m.category === activeCategory);
  const filteredPredictive = dynamicBets.filter(b => b.categoria === activeCategory && (b.status === "ativa" || b.status === "finalizada"));
  const activeCat = categories.find(c => c.id === activeCategory)!;

  const potentialWin = (selectedMatch && selectedOdd || selectedPredictive && selectedPredictiveOption) && betAmount
    ? (Number(betAmount) * (
        selectedMatch 
          ? (selectedOdd === "A" ? selectedMatch.oddsA : selectedOdd === "draw" ? (selectedMatch.oddsDraw || 0) : selectedMatch.oddsB)
          : (selectedPredictiveOption?.odds || 0)
      )).toFixed(0)
    : "0";

  return (
    <div className="min-h-screen bg-background pb-28">
      <PageHeader title="Apostas" onBack={() => onNavigate("home")} />

      <motion.div
        className="space-y-5"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {/* Balance strip */}
        <motion.div variants={fadeUp} className="px-4">
          <div className="flex items-center justify-between bg-card rounded-xl p-3 border border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <Trophy size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Saldo para apostas</p>
                <p className="text-lg font-black text-foreground tabular-nums">{totalPoints} <span className="text-xs font-bold text-muted-foreground">pts</span></p>
              </div>
            </div>
            <button
              onClick={() => onNavigate("wallet")}
              className="text-xs font-bold text-primary flex items-center gap-0.5"
            >
              Carteira <ChevronRight size={14} />
            </button>
          </div>
        </motion.div>

        {/* Main Tabs */}
        <motion.div variants={fadeUp} className="px-4">
          <div className="flex bg-muted rounded-xl p-1">
            <button
              onClick={() => setActiveTab("explorar")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "explorar" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              EXPLORAR
            </button>
            <button
              onClick={() => setActiveTab("minhas")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "minhas" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              MINHAS APOSTAS
              {userBets.filter(b => b.status === "pendente").length > 0 && (
                <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[8px] flex items-center justify-center">
                  {userBets.filter(b => b.status === "pendente").length}
                </span>
              )}
            </button>
          </div>
        </motion.div>

        {/* Categories */}
        <motion.div variants={fadeUp} className="px-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-[0_4px_12px_hsl(var(--primary)/0.3)]"
                      : "bg-card text-muted-foreground border border-border/50"
                  }`}
                >
                  <Icon size={14} />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {activeTab === "explorar" ? (
          <>
        {/* Section title */}
        <motion.div variants={fadeUp} className="px-4 flex items-center gap-2">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_4px_1.5px_hsl(var(--primary)/0.4)]"
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
            transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
          />
          <h3 className="font-bold text-sm text-foreground">{activeCat.label}</h3>
          <span className="text-xs text-muted-foreground">({filteredMatches.length + filteredPredictive.length} eventos)</span>
        </motion.div>

        {/* Predictive Bets (Dynamic) */}
        {filteredPredictive.length > 0 && (
          <motion.div variants={stagger} className="px-4 space-y-3 mb-4">
            {filteredPredictive.map((bet) => (
              <motion.div
                key={bet.id}
                variants={fadeUp}
                className="bg-primary/5 rounded-xl border border-primary/20 shadow-sm overflow-hidden"
              >
                <div className="p-3.5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] text-muted-foreground">
                      {bet.status === "finalizada" ? "Encerrada" : `Termina em: ${new Date(bet.dataLimite).toLocaleDateString()}`}
                    </span>
                    <span className={`flex items-center gap-1 text-[10px] font-bold ${bet.status === "finalizada" ? "text-muted-foreground" : "text-primary"}`}>
                      <Flame size={10} className={bet.status === "ativa" ? "animate-pulse" : ""} /> PREDITIVA
                    </span>
                  </div>

                  <div className="mb-3 text-center">
                    <span className="text-sm font-bold text-foreground">{bet.titulo}</span>
                    {bet.descricao && <p className="text-[10px] text-muted-foreground mt-1">{bet.descricao}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {bet.opcoes.map((op) => {
                      const isWinner = (bet as any).vencedorId === op.id;
                      return (
                        <button
                          key={op.id}
                          disabled={bet.status === "finalizada"}
                          onClick={() => { 
                            setSelectedPredictive(bet); 
                            setSelectedPredictiveOption(op);
                            setSelectedMatch(null); 
                            setSelectedOdd(null); 
                            setBetAmount(""); 
                          }}
                          className={`relative border rounded-lg py-2 text-center active:scale-[0.96] transition-transform ${
                            isWinner 
                              ? "bg-yellow-500/20 border-yellow-500" 
                              : "bg-card border-primary/20"
                          } ${bet.status === "finalizada" ? "opacity-80" : ""}`}
                        >
                          <p className="text-[10px] text-muted-foreground truncate px-1">{op.label}</p>
                          <p className="text-sm font-black text-primary">{op.odds.toFixed(2)}</p>
                          {isWinner && <Trophy size={12} className="absolute top-1 right-1 text-yellow-500" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Matches */}
        <motion.div variants={stagger} className="px-4 space-y-3">
          {filteredMatches.map((match) => (
            <motion.div
              key={match.id}
              variants={fadeUp}
              className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden"
            >
              <div className="p-3.5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] text-muted-foreground">{match.time}</span>
                  {match.live && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-red-400">
                      <Zap size={10} className="animate-pulse" /> AO VIVO
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-foreground flex-1">{match.teamA}</span>
                  <span className="text-xs font-black text-muted-foreground mx-2">VS</span>
                  <span className="text-sm font-bold text-foreground flex-1 text-right">{match.teamB}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => { setSelectedMatch(match); setSelectedOdd("A"); setBetAmount(""); }}
                    className="flex-1 bg-muted rounded-lg py-2 text-center active:scale-[0.96] transition-transform"
                  >
                    <p className="text-[10px] text-muted-foreground">1</p>
                    <p className="text-sm font-black text-foreground">{match.oddsA.toFixed(2)}</p>
                  </button>
                  {match.oddsDraw !== undefined && (
                    <button
                      onClick={() => { setSelectedMatch(match); setSelectedOdd("draw"); setBetAmount(""); }}
                      className="flex-1 bg-muted rounded-lg py-2 text-center active:scale-[0.96] transition-transform"
                    >
                      <p className="text-[10px] text-muted-foreground">X</p>
                      <p className="text-sm font-black text-foreground">{match.oddsDraw.toFixed(2)}</p>
                    </button>
                  )}
                  <button
                    onClick={() => { setSelectedMatch(match); setSelectedOdd("B"); setBetAmount(""); }}
                    className="flex-1 bg-muted rounded-lg py-2 text-center active:scale-[0.96] transition-transform"
                  >
                    <p className="text-[10px] text-muted-foreground">2</p>
                    <p className="text-sm font-black text-foreground">{match.oddsB.toFixed(2)}</p>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </>
    ) : (
      /* User Bets Tab */
      <motion.div variants={stagger} className="px-4 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm text-foreground uppercase tracking-widest">Seu Histórico</h3>
              <div className="text-[10px] font-bold text-muted-foreground uppercase">
                {userBets.length} APOSTAS NO TOTAL
              </div>
            </div>

            {userBets.length > 0 ? (
              [...userBets].reverse().map((bet) => {
                const predictiveBet = dynamicBets.find(b => b.id === bet.apostaId);
                const title = predictiveBet?.titulo || (bet.apostaId.startsWith("match-") ? "Partida Esportiva" : "Aposta");
                const optionLabel = predictiveBet 
                  ? predictiveBet.opcoes.find(o => o.id === bet.opcaoId)?.label 
                  : (bet.opcaoId === "A" ? "Time Casa" : bet.opcaoId === "B" ? "Time Fora" : "Empate");

                return (
                  <motion.div
                    key={bet.id}
                    variants={fadeUp}
                    className="bg-card rounded-2xl border border-border p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          bet.status === "vencida" ? "bg-green-500/10" : 
                          bet.status === "perdida" ? "bg-red-500/10" : "bg-primary/10"
                        }`}>
                          {bet.status === "vencida" ? <Trophy size={14} className="text-green-500" /> : 
                           bet.status === "perdida" ? <X size={14} className="text-red-400" /> : 
                           <Zap size={14} className="text-primary animate-pulse" />}
                        </div>
                        <div>
                          <p className="text-xs font-black text-foreground">{title}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(bet.data).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                        bet.status === "vencida" ? "bg-green-500/15 text-green-500" : 
                        bet.status === "perdida" ? "bg-red-500/15 text-red-400" : "bg-primary/15 text-primary"
                      }`}>
                        {bet.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3 border-y border-border/50">
                      <div>
                        <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Seu Palpite</p>
                        <p className="text-sm font-bold text-foreground">{optionLabel}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Odd</p>
                        <p className="text-sm font-black text-primary">{bet.odd.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <p className="text-[9px] text-muted-foreground font-bold">VALOR</p>
                        <p className="text-sm font-black text-foreground">{bet.valor} pts</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-muted-foreground font-bold">{bet.status === "vencida" ? "GANHO" : "RETORNO POTENCIAL"}</p>
                        <p className={`text-lg font-black tabular-nums ${bet.status === "vencida" ? "text-green-500" : "text-primary"}`}>
                          {bet.status === "vencida" ? `+${bet.retornoPotencial}` : bet.retornoPotencial} 
                          <span className="text-xs ml-0.5">pts</span>
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="py-20 text-center">
                <div className="w-16 h-16 rounded-3xl bg-muted mx-auto mb-4 flex items-center justify-center text-muted-foreground">
                  <Flame size={32} />
                </div>
                <h4 className="font-bold text-foreground">Nenhuma aposta feita</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">Suas apostas aparecerão aqui depois que você confirmar seu primeiro palpite.</p>
                <button 
                  onClick={() => setActiveTab("explorar")}
                  className="mt-6 bg-primary text-primary-foreground text-xs font-black px-6 py-3 rounded-xl shadow-lg"
                >
                  EXPLORAR EVENTOS
                </button>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Bet Modal */}
      <AnimatePresence>
        {(selectedMatch && selectedOdd || selectedPredictive && selectedPredictiveOption) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center"
            onClick={() => { setSelectedMatch(null); setSelectedPredictive(null); setSelectedPredictiveOption(null); setSelectedOdd(null); }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card rounded-t-3xl p-6 pb-28 border-t border-border/50 relative overflow-hidden"
            >
              <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-5" />
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-black text-foreground">Fazer Aposta</h3>
                <button onClick={() => { setSelectedMatch(null); setSelectedPredictive(null); setSelectedPredictiveOption(null); setSelectedOdd(null); }} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <X size={16} className="text-muted-foreground" />
                </button>
              </div>

              <div className="bg-muted rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-foreground">
                    {selectedMatch ? `${selectedMatch.teamA} vs ${selectedMatch.teamB}` : selectedPredictive?.titulo}
                  </span>
                  {(selectedMatch?.live || selectedPredictive) && <span className="text-[10px] font-bold text-primary">ATIVA</span>}
                </div>
                <p className="text-xs text-muted-foreground">
                  Aposta: <span className="font-bold text-foreground">
                    {selectedMatch 
                      ? (selectedOdd === "A" ? selectedMatch.teamA : selectedOdd === "draw" ? "Empate" : selectedMatch.teamB)
                      : selectedPredictiveOption?.label}
                  </span>
                  {" — Odd: "}
                  <span className="font-bold text-primary">
                    {selectedMatch 
                      ? (selectedOdd === "A" ? selectedMatch.oddsA : selectedOdd === "draw" ? selectedMatch.oddsDraw : selectedMatch.oddsB)?.toFixed(2)
                      : selectedPredictiveOption?.odds.toFixed(2)}
                  </span>
                </p>
              </div>

              <div className="mb-4">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Quantidade de pontos</label>
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  placeholder="0"
                  min="1"
                  max={totalPoints}
                  className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/40"
                />
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-[10px] text-muted-foreground">Saldo: {totalPoints} pts</p>
                  <div className="flex gap-1.5">
                    {[10, 25, 50].map(v => (
                      <button
                        key={v}
                        onClick={() => setBetAmount(String(Math.min(v, totalPoints)))}
                        className="text-[10px] font-bold text-primary bg-primary/10 rounded-lg px-2 py-1"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-primary/10 rounded-xl p-3 mb-5 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Retorno potencial</span>
                <span className="text-lg font-black text-primary tabular-nums">{potentialWin} pts</span>
              </div>

              <button
                onClick={() => {
                  if (!betAmount || Number(betAmount) <= 0) return;
                  
                  const amount = Number(betAmount);
                  const odd = selectedMatch 
                    ? (selectedOdd === "A" ? selectedMatch.oddsA : selectedOdd === "draw" ? (selectedMatch.oddsDraw || 0) : selectedMatch.oddsB)
                    : (selectedPredictiveOption?.odds || 0);
                  
                  // Save user bet
                  const newUserBet: UserBet = {
                    id: Math.random().toString(36).substring(2, 9),
                    apostaId: selectedMatch ? `match-${selectedMatch.id}` : selectedPredictive?.id || "",
                    opcaoId: selectedMatch ? selectedOdd! : selectedPredictiveOption?.id || "",
                    valor: amount,
                    odd: odd,
                    data: new Date().toISOString(),
                    status: "pendente",
                    retornoPotencial: Math.floor(amount * odd)
                  };

                  const existingUserBets = JSON.parse(localStorage.getItem("beep_user_bets") || "[]");
                  localStorage.setItem("beep_user_bets", JSON.stringify([...existingUserBets, newUserBet]));

                  removePoints(amount);
                  setBetConfirmed(true);
                  
                  setTimeout(() => {
                    setBetConfirmed(false);
                    setSelectedMatch(null);
                    setSelectedPredictive(null);
                    setSelectedPredictiveOption(null);
                    setSelectedOdd(null);
                    setBetAmount("");
                  }, 1800);
                }}
                disabled={!betAmount || Number(betAmount) <= 0 || betConfirmed || Number(betAmount) > totalPoints}
                className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl shadow-[0_4px_16px_hsl(var(--primary)/0.3)] active:scale-[0.97] transition-all disabled:opacity-50"
              >
                Confirmar Aposta
              </button>

              {/* Success overlay */}
              <AnimatePresence>
                {betConfirmed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-card rounded-t-3xl flex flex-col items-center justify-center z-10"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.3, 1] }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mb-5"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 400, damping: 15 }}
                      >
                        <Check size={36} className="text-primary" strokeWidth={3} />
                      </motion.div>
                    </motion.div>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-lg font-black text-foreground"
                    >
                      Aposta Confirmada!
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="text-sm text-muted-foreground mt-1"
                    >
                      Retorno potencial: <span className="font-bold text-primary">{potentialWin} pts</span>
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Bets;
