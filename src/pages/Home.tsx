import { useRef, useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Music, TrendingUp, Bell, User, Zap, BarChart3, Send, QrCode, Radio, Tv, ChevronDown, ChevronRight, Trophy, Gamepad2, Headphones as HeadphonesIcon, Podcast, Star } from "lucide-react";
import { stations, sessions } from "@/data/stations";
import { getPersonalizedSuggestions, type Suggestion } from "@/data/suggestions";
import AnimatedPoints from "@/components/AnimatedPoints";
import VotingPoll from "@/components/VotingPoll";
import SharedPollCard from "@/components/SharedPollCard";
import NotificationsPanel from "@/components/NotificationsPanel";
import { useNotifications } from "@/contexts/NotificationsContext";
import beepLogo from "@/assets/beep-logo.png";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 300, damping: 26 } },
};

const slideInRight = {
  hidden: { opacity: 0, x: 40, filter: "blur(4px)" },
  show: { opacity: 1, x: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 300, damping: 28 } },
};

const quickActions = [
  { label: "Ao Vivo", icon: Zap, action: "recognition" },
  { label: "Histórico", icon: BarChart3, action: "history" },
  { label: "Emissoras", icon: Send, action: "stationprofile" },
  { label: "Detalhes", icon: QrCode, action: "detail" },
];

const typeConfig: Record<string, { icon: typeof Zap; color: string; bg: string }> = {
  programa: { icon: Tv, color: "text-primary", bg: "bg-primary/15" },
  quiz: { icon: Gamepad2, color: "text-accent-foreground", bg: "bg-accent/15" },
  playlist: { icon: Music, color: "text-primary", bg: "bg-primary/15" },
  desafio: { icon: Star, color: "text-destructive", bg: "bg-destructive/15" },
  podcast: { icon: Podcast, color: "text-primary", bg: "bg-primary/15" },
};

const PersonalizedSection = ({ onNavigate }: { onNavigate?: (page: string) => void }) => {
  const interests = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("beep_interests") || "[]") as string[];
    } catch { return []; }
  }, []);

  const items = useMemo(() => getPersonalizedSuggestions(interests), [interests]);

  if (!items.length) return null;

  // Split into featured (first 2) and rest
  const featured = items.slice(0, 2);
  const rest = items.slice(2, 8);

  return (
    <motion.div
      className="px-5 mt-6"
      initial="hidden"
      animate="show"
      variants={stagger}
    >
      <motion.div variants={fadeUp} className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_4px_1.5px_hsl(var(--primary)/0.4)]"
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
            transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, delay: 0.3 }}
          />
          <h3 className="font-bold text-sm text-foreground">Para Você</h3>
          <span className="text-[9px] font-bold text-primary bg-primary/15 rounded-full px-2 py-0.5">✨ Personalizado</span>
        </div>
      </motion.div>

      {/* Featured cards — larger */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 mb-3">
        {featured.map((item, i) => {
          const cfg = typeConfig[item.type] || typeConfig.programa;
          const Icon = cfg.icon;
          return (
            <motion.button
              key={item.id}
              onClick={() => onNavigate?.("detail")}
              className="relative p-4 bg-card rounded-2xl border border-border text-left overflow-hidden active:scale-[0.97] transition-all"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.1, type: "spring", stiffness: 300, damping: 24 }}
              whileTap={{ scale: 0.95 }}
            >
              {item.badge && (
                <span className="absolute top-2.5 right-2.5 text-[8px] font-black bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                  {item.badge}
                </span>
              )}
              <span className="text-2xl mb-2 block">{item.emoji}</span>
              <p className="text-xs font-bold text-foreground leading-tight mb-1">{item.title}</p>
              <p className="text-[10px] text-muted-foreground leading-snug mb-3">{item.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Trophy size={10} className="text-primary" />
                  <span className="text-[10px] font-bold text-primary">+{item.points} pts</span>
                </div>
                {item.duration && (
                  <span className="text-[9px] text-muted-foreground font-medium">{item.duration}</span>
                )}
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Rest — compact list */}
      <div className="space-y-2">
        {rest.map((item, i) => {
          const cfg = typeConfig[item.type] || typeConfig.programa;
          const Icon = cfg.icon;
          return (
            <motion.button
              key={item.id}
              onClick={() => onNavigate?.("detail")}
              className="w-full flex items-center gap-3 p-3 bg-card rounded-2xl border border-border text-left active:scale-[0.98] transition-all"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.06, type: "spring", stiffness: 300, damping: 26 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                <Icon size={18} className={cfg.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-foreground truncate">{item.emoji} {item.title}</p>
                  {item.badge && (
                    <span className="text-[8px] font-bold bg-primary/15 text-primary rounded-full px-1.5 py-0.5 shrink-0">
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{item.description}</p>
              </div>
              <div className="text-right shrink-0 flex flex-col items-end gap-1">
                <div className="flex items-center gap-0.5">
                  <Trophy size={9} className="text-primary" />
                  <span className="text-[10px] font-bold text-primary">+{item.points}</span>
                </div>
                <span className="text-[9px] text-muted-foreground">{item.type}</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

const SharedPollsSection = () => {
  const sharedPolls = useMemo(() => {
    try {
      const polls = JSON.parse(localStorage.getItem("beep_shared_polls") || "[]") as import("@/data/politicians").PesquisaIntencao[];
      return polls.filter((p) => p.status === "ativa");
    } catch {
      return [];
    }
  }, []);

  if (!sharedPolls.length) return null;

  return (
    <div className="mt-2">
      {sharedPolls.map((poll) => (
        <SharedPollCard key={poll.id} pesquisa={poll} />
      ))}
    </div>
  );
};

const recentSessions = sessions.slice(0, 4);

const Home = ({ onNavigate }: { onNavigate: (page: string, stationId?: string, sessionId?: number) => void }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const { unreadCount } = useNotifications();
  const collapsed = scrollProgress > 60;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => setScrollProgress(el.scrollTop);
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, []);

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div ref={scrollRef} className="flex flex-col h-screen bg-background overflow-y-auto overflow-x-hidden pb-28">
      {/* Sticky mini-header */}
      <div
        className="sticky top-0 z-50 transition-all duration-300 ease-out"
        style={{
          transform: collapsed ? "translateY(0)" : "translateY(-100%)",
          opacity: collapsed ? 1 : 0,
          pointerEvents: collapsed ? "auto" : "none",
          marginBottom: collapsed ? 0 : -48,
        }}
      >
        <div className="bg-card-dark/95 backdrop-blur-xl border-b border-card-dark-foreground/10 px-4 py-2.5 flex items-center justify-between shadow-lg shadow-black/20">
          <div className="flex items-center gap-2">
            <img src={beepLogo} alt="BEEP" className="w-6 h-6 object-contain" />
            <span className="text-[8px] font-bold text-primary bg-primary/20 rounded-full px-1.5 py-0.5">R&TV</span>
          </div>
          <div className="flex items-center gap-2">
            <AnimatedPoints size="sm" />
            <button
              onClick={scrollToTop}
              className="w-7 h-7 rounded-full bg-card-dark-foreground/10 flex items-center justify-center"
            >
              <ChevronDown size={14} className="text-card-dark-foreground/60 rotate-180" />
            </button>
            <button className="w-7 h-7 rounded-full bg-card-dark-foreground/10 flex items-center justify-center">
              <Bell size={14} className="text-card-dark-foreground/60" />
            </button>
          </div>
        </div>
      </div>
      {/* Header area with dark card - always full size, no collapse */}
      <div
        className="bg-card-dark relative overflow-hidden shrink-0"
        style={{
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
          paddingBottom: 24,
        }}
      >
        {/* Animated glow orbs */}
        <motion.div
          className="absolute top-0 right-0 w-40 h-40 bg-primary/15 rounded-full -translate-y-16 translate-x-10 blur-3xl"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full translate-y-10 -translate-x-8 blur-2xl"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
        />

        <motion.div
          className="relative px-5 pt-14"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {/* Top bar */}
          <motion.div
            variants={fadeUp}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <img src={beepLogo} alt="BEEP" className="w-12 h-12 object-contain" />
                <motion.span
                  className="text-[10px] font-bold text-primary bg-primary/20 rounded-full px-1.5 py-0.5 ml-0.5"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 400 }}
                >
                  RADIO & TV
                </motion.span>
              </div>
              <p className="text-xs text-card-dark-foreground/50 font-medium">
                Boa tarde, User 👋
              </p>
            </div>
            <motion.div className="flex items-center gap-2" variants={slideInRight}>
              <AnimatedPoints size="md" />
              <motion.button
                onClick={() => setShowNotifications(true)}
                className="w-10 h-10 rounded-full bg-card-dark-foreground/10 flex items-center justify-center relative"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Bell size={18} className="text-card-dark-foreground/70" />
                {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[8px] font-bold flex items-center justify-center shadow-[0_0_6px_hsl(var(--primary)/0.5)]">{unreadCount}</span>}
              </motion.button>
              <motion.button
                onClick={() => onNavigate("profile")}
                className="w-10 h-10 rounded-full bg-card-dark-foreground/10 flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <User size={18} className="text-card-dark-foreground/70" />
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Content sections - always visible, no collapse */}
        <div className="px-5 overflow-hidden">
          {/* Main Balance Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24, delay: 0.3 }}
            className="bg-card-dark-foreground/6 border border-card-dark-foreground/15 rounded-2xl p-4 mb-2 relative overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-card-dark-foreground/8 to-transparent -skew-x-12 pointer-events-none"
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{ duration: 1.8, delay: 0.6, ease: "easeInOut" }}
            />
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-card-dark-foreground/60">Sessões este mês</span>
                <motion.p
                  className="text-[2.2rem] font-extrabold text-card-dark-foreground leading-none tracking-tight mt-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
                >
                  47
                </motion.p>
                <p className="text-[11px] text-card-dark-foreground/55 mt-1">8 sessões a mais que no mês anterior</p>
              </div>

              <motion.div
                className="inline-flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/20 rounded-full px-2.5 py-1"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, type: "spring", stiffness: 500 }}
              >
                <TrendingUp size={11} />
                +14.8%
              </motion.div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4">
              {[
                { icon: Music, value: "312", label: "faixas" },
                { icon: Radio, value: "8", label: "rádios" },
                { icon: Tv, value: "4", label: "TVs" },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  className="rounded-xl bg-card-dark-foreground/8 border border-card-dark-foreground/10 px-2.5 py-2 text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 24, delay: 0.55 + i * 0.08 }}
                >
                  <item.icon size={12} className="text-primary mx-auto mb-1" />
                  <p className="text-sm font-bold text-card-dark-foreground leading-none">{item.value}</p>
                  <p className="text-[10px] text-card-dark-foreground/60 mt-0.5">{item.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-3 mt-5">
            {quickActions.map((action, i) => (
              <motion.button
                key={action.label}
                onClick={() => onNavigate(action.action)}
                className="flex flex-col items-center gap-1.5 group"
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.08, type: "spring", stiffness: 400, damping: 22 }}
                whileTap={{ scale: 0.85 }}
              >
                <div className="w-12 h-12 rounded-2xl bg-card-dark-foreground/10 flex items-center justify-center transition-colors group-hover:bg-card-dark-foreground/15">
                  <action.icon size={20} className="text-card-dark-foreground/80" />
                </div>
                <span className="text-[11px] font-medium text-card-dark-foreground/60">{action.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Stats Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24, delay: 0.5 }}
            className="mt-5 bg-card-dark-foreground/5 border border-card-dark-foreground/10 rounded-2xl p-4 relative overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-card-dark-foreground/8 to-transparent -skew-x-12 pointer-events-none"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2.5, delay: 1, ease: "easeInOut", repeat: Infinity, repeatDelay: 3 }}
            />
            <motion.div
              className="w-full h-24 rounded-xl mb-3 relative overflow-hidden bg-gradient-to-br from-primary/80 via-primary/40 to-accent/60"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-transparent" />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12 pointer-events-none"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2, delay: 1.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 4 }}
              />
              <div className="absolute top-2.5 left-3 flex items-center gap-1.5">
                <img src={beepLogo} alt="BEEP" className="w-4 h-4 object-contain" />
                <span className="text-[9px] text-card-dark-foreground/50 ml-1">Pro</span>
              </div>
              <div className="absolute bottom-2.5 left-3 flex items-center gap-6">
                <span className="text-[11px] font-mono text-card-dark-foreground/70 tracking-widest">•••• 4821</span>
                <span className="text-[10px] font-medium text-card-dark-foreground/50">03/27</span>
              </div>
              <div className="absolute top-2.5 right-3 flex items-center gap-1">
                <div className="w-5 h-5 rounded-full bg-destructive/80 -mr-2" />
                <div className="w-5 h-5 rounded-full bg-primary/80" />
              </div>
            </motion.div>

            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[10px] font-medium text-card-dark-foreground/40 uppercase tracking-wider">Créditos</p>
                <p className="text-xl font-extrabold text-card-dark-foreground tracking-tight">R$ 596,00</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onNavigate("wallet")} className="w-7 h-7 rounded-lg bg-card-dark-foreground/8 flex items-center justify-center">
                  <BarChart3 size={12} className="text-card-dark-foreground/50" />
                </button>
                <button onClick={() => onNavigate("wallet")} className="w-7 h-7 rounded-lg bg-card-dark-foreground/8 flex items-center justify-center">
                  <Send size={12} className="text-card-dark-foreground/50" />
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-card-dark-foreground/40 font-medium">Uso de reconhecimento</span>
                  <span className="text-[10px] font-semibold text-card-dark-foreground/60">105 / 200</span>
                </div>
                <div className="h-1.5 bg-card-dark-foreground/8 rounded-full overflow-hidden">
                  <div className="h-full w-[52%] bg-primary rounded-full" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-card-dark-foreground/40 font-medium">Limite do plano</span>
                  <span className="text-[10px] font-semibold text-card-dark-foreground/60">890 / 1000</span>
                </div>
                <div className="h-1.5 bg-card-dark-foreground/8 rounded-full overflow-hidden">
                  <div className="h-full w-[89%] bg-gradient-to-r from-primary to-destructive/70 rounded-full" />
                </div>
              </div>
            </div>

            <div className="mt-3 py-2 px-3 bg-card-dark-foreground/5 rounded-xl flex items-center justify-between">
              <span className="text-[10px] text-card-dark-foreground/40">Próx. renovação em Abril: <span className="text-card-dark-foreground/70 font-semibold">R$ 119</span></span>
              <div className="w-4 h-4 rounded-full border border-card-dark-foreground/20 flex items-center justify-center">
                <span className="text-[8px] text-card-dark-foreground/40">?</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Favorite Stations */}
      <motion.div
        className="px-5 mt-6"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={fadeUp} className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_4px_1.5px_hsl(var(--primary)/0.4)]"
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
            />
            <h3 className="font-bold text-sm text-foreground">Rádio & TV Favoritos</h3>
          </div>
          <button
            onClick={() => onNavigate("stationprofile")}
            className="text-xs font-semibold text-primary flex items-center gap-0.5"
          >
            Ver todas
          </button>
        </motion.div>
        <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
          {stations.map((station) => (
            <button
              key={station.id}
              onClick={() => onNavigate("stationprofile", station.id)}
              className="flex items-center gap-2.5 p-3 bg-card rounded-2xl border border-border active:scale-[0.97] transition-all"
            >
              <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <station.icon size={16} className="text-primary" />
              </div>
              <div className="min-w-0 text-left">
                <p className="text-[11px] font-semibold text-foreground truncate">{station.name}</p>
                <p className="text-[10px] text-muted-foreground">{station.freq}</p>
              </div>
            </button>
          ))}
        </motion.div>
      </motion.div>

      {/* Latest Sessions */}
      <motion.div
        className="px-5 mt-6 flex-1"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={fadeUp} className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_4px_1.5px_hsl(var(--primary)/0.4)]"
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, delay: 0.5 }}
            />
            <h3 className="font-bold text-sm text-foreground">Sessões Recentes</h3>
          </div>
          <button
            onClick={() => onNavigate("history")}
            className="text-xs font-semibold text-primary flex items-center gap-0.5"
          >
            Ver tudo
          </button>
        </motion.div>

        <div className="space-y-3">
          {recentSessions.map((session) => {
            const stationData = stations.find((s) => s.id === session.stationId);
            const Icon = stationData?.icon || Radio;
            return (
              <motion.button
                key={session.id}
                variants={fadeUp}
                onClick={() => onNavigate("detail", session.stationId, session.id)}
                className="w-full flex items-center gap-3 p-3 bg-card rounded-2xl border border-border text-left active:scale-[0.98] transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm text-foreground truncate">{session.station}</p>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${session.type === "tv"
                        ? "bg-accent/15 text-accent-foreground"
                        : "bg-primary/15 text-primary"
                      }`}>
                      {session.type === "tv" ? "TV" : "Rádio"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{session.freq}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-foreground">{session.tracks} faixas</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{session.timeAgo}</p>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Insight Card */}
        <motion.div
          variants={fadeUp}
          className="mt-5 mb-4 p-4 bg-primary/10 border border-primary/15 rounded-2xl flex items-start gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
            <TrendingUp size={16} className="text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">Suas sessões aumentaram 23% esta semana!</p>
            <button onClick={() => onNavigate("history")} className="text-[11px] text-primary mt-1 font-semibold">Veja o que você pode descobrir ainda mais →</button>
          </div>
        </motion.div>
      </motion.div>

      {/* Personalized Suggestions — "Para Você" */}
      <PersonalizedSection onNavigate={onNavigate} />

      {/* Voting Poll — only for "politica" interest */}
      <VotingPoll />

      {/* Shared Polls from politicians */}
      <SharedPollsSection />

      <div className="h-24" />

      <NotificationsPanel open={showNotifications} onClose={() => setShowNotifications(false)} />
    </div>
  );
};

export default Home;
