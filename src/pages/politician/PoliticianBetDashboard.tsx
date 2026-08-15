import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Flame, 
  Clock, 
  CheckCircle2, 
  FileEdit, 
  Trophy, 
  AlertCircle, 
  ChevronRight,
  TrendingUp,
  Users,
  Calendar
} from "lucide-react";
import { toast } from "sonner";
import { usePoints } from "@/contexts/PointsContext";
import { useNotifications } from "@/contexts/NotificationsContext";
import { type GabineteProfile, type ApostaPreditiva, type ApostaOpcao } from "@/data/politicians";
import { type UserBet } from "@/pages/Bets";

const statusConfig = {
  ativa: { label: "Ativa", icon: Clock, color: "text-green-500 bg-green-500/10" },
  finalizada: { label: "Finalizada", icon: CheckCircle2, color: "text-primary bg-primary/10" },
  rascunho: { label: "Rascunho", icon: FileEdit, color: "text-yellow-500 bg-yellow-500/10" },
};

const PoliticianBetDashboard = ({ gabinete }: { gabinete: GabineteProfile }) => {
  const { addPoints } = usePoints();
  const { addNotification } = useNotifications();
  const [apostas, setApostas] = useState<ApostaPreditiva[]>([]);
  const [selectedBet, setSelectedBet] = useState<ApostaPreditiva | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<string | null>(null); // optionId

  useEffect(() => {
    const saved = localStorage.getItem("beep_apostas");
    if (saved) {
      const allBets = JSON.parse(saved) as ApostaPreditiva[];
      // Filter bets created by this "gabinete" (creator)
      setApostas(allBets.filter(b => b.criadoPor === gabinete.id));
    }
  }, [gabinete.id]);

  const handleFinalize = (optionId: string) => {
    if (!selectedBet) return;

    // 1. Update bet status
    const updatedBets = apostas.map(b => {
      if (b.id === selectedBet.id) {
        return { ...b, status: "finalizada" as const };
      }
      return b;
    });

    const allSaved = JSON.parse(localStorage.getItem("beep_apostas") || "[]") as ApostaPreditiva[];
    const updatedAll = allSaved.map(b => {
      if (b.id === selectedBet.id) {
        return { ...b, status: "finalizada" as const, vencedorId: optionId };
      }
      return b;
    });
    localStorage.setItem("beep_apostas", JSON.stringify(updatedAll));

    // 2. Distribute points to winners
    const userBets = JSON.parse(localStorage.getItem("beep_user_bets") || "[]") as UserBet[];
    let totalWinners = 0;
    let totalPointsDistributed = 0;

    const updatedUserBets = userBets.map(ub => {
      if (ub.apostaId === selectedBet.id && ub.status === "pendente") {
        if (ub.opcaoId === optionId) {
          // User won!
          addPoints(ub.retornoPotencial, `Você ganhou ${ub.retornoPotencial} pts na aposta: ${selectedBet.titulo}`);
          addNotification({
            icon: Trophy,
            title: "Você ganhou uma aposta!",
            description: `Seu palpite em "${selectedBet.titulo}" foi certeiro. +${ub.retornoPotencial} pts na carteira!`,
            color: "text-primary"
          });
          totalWinners++;
          totalPointsDistributed += ub.retornoPotencial;
          return { ...ub, status: "vencida" as const };
        } else {
          // User lost
          addNotification({
            icon: AlertCircle,
            title: "Resultado da aposta",
            description: `A aposta "${selectedBet.titulo}" foi encerrada. Infelizmente seu palpite não venceu desta vez.`,
            color: "text-muted-foreground"
          });
          return { ...ub, status: "perdida" as const };
        }
      }
      return ub;
    });
    localStorage.setItem("beep_user_bets", JSON.stringify(updatedUserBets));

    // 3. Update UI state
    setApostas(updatedBets);
    setSelectedBet({ ...selectedBet, status: "finalizada", vencedorId: optionId } as any);
    setShowConfirmModal(null);
    
    toast.success("Aposta finalizada!", {
      description: `Vencedor definido. ${totalWinners} participantes receberam um total de ${totalPointsDistributed} pontos.`
    });
  };

  if (selectedBet) {
    const isFinished = selectedBet.status === "finalizada";
    
    return (
      <div className="px-4 pt-4 pb-20">
        <button 
          onClick={() => setSelectedBet(null)} 
          className="text-xs font-bold text-primary mb-4 flex items-center gap-1"
        >
          ← VOLTAR PARA LISTA
        </button>

        <div className="bg-card rounded-2xl border border-border p-5 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase">
              {selectedBet.categoria}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${statusConfig[selectedBet.status].color}`}>
              {statusConfig[selectedBet.status].label}
            </span>
          </div>
          <h2 className="text-xl font-black text-foreground mb-2">{selectedBet.titulo}</h2>
          {selectedBet.descricao && (
            <p className="text-sm text-muted-foreground mb-4">{selectedBet.descricao}</p>
          )}
          
          <div className="flex items-center gap-4 py-3 border-y border-border/50">
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Participantes</span>
              <div className="flex items-center gap-1 text-sm font-black text-foreground">
                <Users size={14} className="text-primary" />
                {(() => {
                  const userBets = JSON.parse(localStorage.getItem("beep_user_bets") || "[]") as UserBet[];
                  const realBets = userBets.filter(ub => ub.apostaId === selectedBet.id).length;
                  return realBets + 124; // Base simulated crowd + real bets
                })()}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Data Limite</span>
              <div className="flex items-center gap-1 text-sm font-black text-foreground">
                <Calendar size={14} className="text-primary" />
                {new Date(selectedBet.dataLimite).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        <h3 className="text-sm font-bold text-foreground mb-3 px-1 flex items-center gap-2">
          {isFinished ? <Trophy size={16} className="text-yellow-500" /> : <AlertCircle size={16} className="text-primary" />}
          {isFinished ? "Resultado Final" : "Selecione o Vencedor para Encerrar"}
        </h3>

        <div className="space-y-3">
          {selectedBet.opcoes.map((opcao) => {
            const isWinner = (selectedBet as any).vencedorId === opcao.id;
            
            return (
              <div 
                key={opcao.id}
                className={`relative bg-card rounded-2xl border-2 p-4 transition-all ${
                  isWinner 
                    ? "border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]" 
                    : isFinished 
                      ? "border-border opacity-60" 
                      : "border-border hover:border-primary/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground">{opcao.label}</p>
                    <p className="text-xs text-muted-foreground">Odds: {opcao.odds.toFixed(2)}</p>
                  </div>
                  
                  {!isFinished ? (
                    <button
                      onClick={() => setShowConfirmModal(opcao.id)}
                      className="bg-primary text-primary-foreground text-[10px] font-black px-4 py-2 rounded-xl shadow-lg active:scale-95 transition-all"
                    >
                      MARCAR VENCEDOR
                    </button>
                  ) : isWinner ? (
                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                      <Trophy size={20} />
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal de Confirmação */}
        <AnimatePresence>
          {showConfirmModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center px-6"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-card w-full max-w-xs rounded-3xl p-6 border border-border shadow-2xl text-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={32} className="text-primary" />
                </div>
                <h3 className="text-lg font-black text-foreground mb-2">Encerrar Aposta?</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Você está confirmando que <strong>"{selectedBet.opcoes.find(o => o.id === showConfirmModal)?.label}"</strong> é o vencedor. Esta ação não pode ser desfeita.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowConfirmModal(null)}
                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-muted text-muted-foreground"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => handleFinalize(showConfirmModal)}
                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-primary text-primary-foreground"
                  >
                    Confirmar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (apostas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4 text-muted-foreground">
          <Flame size={28} />
        </div>
        <h3 className="font-bold text-foreground mb-1">Nenhuma aposta criada</h3>
        <p className="text-sm text-muted-foreground">Você ainda não criou nenhum desafio preditivo. Vá na aba "Nova" para começar!</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Suas Apostas</h2>
        <div className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          <TrendingUp size={10} />
          {apostas.length} TOTAL
        </div>
      </div>

      <div className="space-y-3">
        {apostas.map((aposta, i) => {
          const cfg = statusConfig[aposta.status];
          const Icon = cfg.icon;
          
          return (
            <motion.button
              key={aposta.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedBet(aposta)}
              className="w-full text-left bg-card rounded-2xl p-4 border border-border hover:border-primary/30 transition-all group relative overflow-hidden"
            >
              {aposta.status === "finalizada" && (
                <div className="absolute -top-1 -right-1 w-12 h-12 bg-primary/5 rotate-45 pointer-events-none" />
              )}
              
              <div className="flex justify-between items-start mb-2">
                <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">
                  {aposta.categoria}
                </span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${cfg.color}`}>
                  <Icon size={10} />
                  {cfg.label}
                </span>
              </div>
              
              <h3 className="font-bold text-foreground text-sm mb-1 group-hover:text-primary transition-colors">{aposta.titulo}</h3>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                <p className="text-[10px] text-muted-foreground font-medium">
                  {aposta.opcoes.length} opções • {new Date(aposta.dataLimite).toLocaleDateString()}
                </p>
                <ChevronRight size={14} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default PoliticianBetDashboard;