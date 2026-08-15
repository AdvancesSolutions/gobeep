import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, TrendingUp, Gift, Music, Zap, Send, Key, Copy, Check, X, QrCode } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { usePoints } from "@/contexts/PointsContext";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 300, damping: 26 } },
};

type Transaction = {
  id: number;
  type: "earned" | "spent";
  label: string;
  description: string;
  amount: number;
  date: string;
  icon: React.ElementType;
};

const transactions: Transaction[] = [
  { id: 1, type: "earned", label: "Reconhecimento", description: "Cidade FM — Música identificada", amount: 15, date: "Hoje, 14:32", icon: Music },
  { id: 2, type: "earned", label: "Bónus diário", description: "Login consecutivo — 3 dias", amount: 10, date: "Hoje, 09:00", icon: Gift },
  { id: 3, type: "spent", label: "Resgate", description: "Desconto exclusivo — Parceiro", amount: -50, date: "Ontem, 18:45", icon: ArrowUpRight },
  { id: 4, type: "earned", label: "Reconhecimento", description: "RFM — Programa ao vivo", amount: 20, date: "Ontem, 11:20", icon: Zap },
  { id: 5, type: "earned", label: "Reconhecimento", description: "SIC TV — Anúncio identificado", amount: 12, date: "2 dias atrás", icon: Music },
  { id: 6, type: "spent", label: "Resgate", description: "Voucher — Loja parceira", amount: -30, date: "3 dias atrás", icon: ArrowUpRight },
  { id: 7, type: "earned", label: "Conquista", description: "10 reconhecimentos seguidos", amount: 25, date: "4 dias atrás", icon: TrendingUp },
  { id: 8, type: "earned", label: "Reconhecimento", description: "Rádio Comercial — Jingle", amount: 8, date: "5 dias atrás", icon: Music },
];

const generateBeepixKey = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const segments = Array.from({ length: 4 }, () =>
    Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  );
  return `BPX-${segments.join("-")}`;
};

const Wallet = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
  const { totalPoints } = usePoints();
  const [activeModal, setActiveModal] = useState<"transfer" | "beepix" | null>(null);
  const [transferAmount, setTransferAmount] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [beepixKey, setBeepixKey] = useState("");
  const [copied, setCopied] = useState(false);

  const totalEarned = transactions.filter(t => t.type === "earned").reduce((s, t) => s + t.amount, 0);
  const totalSpent = Math.abs(transactions.filter(t => t.type === "spent").reduce((s, t) => s + t.amount, 0));

  const handleGenerateBeepix = () => {
    setBeepixKey(generateBeepixKey());
    setCopied(false);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(beepixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <PageHeader title="Carteira" onBack={() => onNavigate("home")} />

      <motion.div
        className="px-4 space-y-5"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {/* Balance Card */}
        <motion.div
          variants={fadeUp}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-amber-600 p-5 shadow-[0_8px_32px_hsl(45_100%_50%/0.25)]"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12 pointer-events-none"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2, delay: 1, ease: "easeInOut", repeat: Infinity, repeatDelay: 4 }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <WalletIcon size={16} className="text-primary-foreground/70" />
              <span className="text-xs font-semibold text-primary-foreground/70 uppercase tracking-wider">Saldo disponível</span>
            </div>
            <div className="flex items-baseline gap-1.5 mb-4">
              <span className="text-4xl font-black text-primary-foreground tabular-nums">{totalPoints}</span>
              <span className="text-sm font-bold text-primary-foreground/60">pts</span>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-1.5 bg-primary-foreground/10 rounded-xl px-3 py-1.5">
                <ArrowDownLeft size={12} className="text-green-300" />
                <span className="text-xs font-bold text-primary-foreground/90">+{totalEarned}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-primary-foreground/10 rounded-xl px-3 py-1.5">
                <ArrowUpRight size={12} className="text-red-300" />
                <span className="text-xs font-bold text-primary-foreground/90">-{totalSpent}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setActiveModal("transfer")}
            className="flex items-center gap-3 bg-card rounded-xl p-4 border border-border/50 shadow-sm active:scale-[0.97] transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Send size={18} className="text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-foreground">Transferir</p>
              <p className="text-[10px] text-muted-foreground">Enviar pontos</p>
            </div>
          </button>
          <button
            onClick={() => { setActiveModal("beepix"); handleGenerateBeepix(); }}
            className="flex items-center gap-3 bg-card rounded-xl p-4 border border-border/50 shadow-sm active:scale-[0.97] transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Key size={18} className="text-accent" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-foreground">Beepix</p>
              <p className="text-[10px] text-muted-foreground">Gerar chave</p>
            </div>
          </button>
        </motion.div>

        {/* Section title */}
        <motion.div variants={fadeUp} className="flex items-center gap-2">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_4px_1.5px_hsl(var(--primary)/0.4)]"
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
            transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
          />
          <h3 className="font-bold text-sm text-foreground">Extrato</h3>
        </motion.div>

        {/* Transactions */}
        <motion.div variants={stagger} className="space-y-2.5">
          {transactions.map((tx) => {
            const Icon = tx.icon;
            const isEarned = tx.type === "earned";
            return (
              <motion.div
                key={tx.id}
                variants={fadeUp}
                className="flex items-center gap-3 bg-card rounded-xl p-3.5 border border-border/50 shadow-sm"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isEarned ? "bg-green-500/10" : "bg-red-500/10"
                }`}>
                  <Icon size={18} className={isEarned ? "text-green-500" : "text-red-400"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{tx.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{tx.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold tabular-nums ${isEarned ? "text-green-500" : "text-red-400"}`}>
                    {isEarned ? "+" : ""}{tx.amount} pts
                  </p>
                  <p className="text-[10px] text-muted-foreground">{tx.date}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card rounded-t-3xl p-6 pb-28 border-t border-border/50"
            >
              <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-5" />

              {activeModal === "transfer" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-foreground">Transferir Pontos</h3>
                    <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <X size={16} className="text-muted-foreground" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Beepix do destinatário</label>
                      <input
                        value={transferTo}
                        onChange={(e) => setTransferTo(e.target.value)}
                        placeholder="BPX-XXXXX-XXXXX-XXXXX-XXXXX"
                        className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Quantidade</label>
                      <input
                        type="number"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                        placeholder="0"
                        min="1"
                        max={totalPoints}
                        className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/40"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">Saldo: {totalPoints} pts</p>
                    </div>
                  </div>
                  <button className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl shadow-[0_4px_16px_hsl(var(--primary)/0.3)] active:scale-[0.97] transition-transform">
                    Enviar Pontos
                  </button>
                </div>
              )}

              {activeModal === "beepix" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-foreground">Sua Chave Beepix</h3>
                    <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <X size={16} className="text-muted-foreground" />
                    </button>
                  </div>

                  <div className="bg-muted rounded-2xl p-5 text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto">
                      <QrCode size={32} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Chave Beepix</p>
                      <p className="text-sm font-mono font-bold text-foreground tracking-wider break-all">{beepixKey}</p>
                    </div>
                    <button
                      onClick={handleCopyKey}
                      className="inline-flex items-center gap-2 bg-card rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground border border-border/50 active:scale-[0.97] transition-transform"
                    >
                      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      {copied ? "Copiado!" : "Copiar chave"}
                    </button>
                  </div>

                  <button
                    onClick={handleGenerateBeepix}
                    className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl shadow-[0_4px_16px_hsl(var(--primary)/0.3)] active:scale-[0.97] transition-transform"
                  >
                    Gerar Nova Chave
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Wallet;
