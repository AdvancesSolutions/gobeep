import { useState, useCallback, useRef, useEffect, RefObject } from "react";
import { motion } from "framer-motion";
import {
  User,
  Sun,
  Moon,
  ChevronRight,
  Edit3,
  LogOut,
  Bell,
  Shield,
  HelpCircle,
  Star,
  Trophy,
  Camera,
  Eye,
  EyeOff,
  ShieldCheck,
  Smartphone,
  Mail,
  MessageSquare,
  KeyRound,
  CheckCircle2,
  Circle,
  Download,
  LayoutGrid,
  Search,
  ArrowUpDown,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { usePoints } from "@/contexts/PointsContext";
import { type ApostaPreditiva } from "@/data/politicians";
import { type UserBet } from "@/pages/Bets";
import AnimatedPoints from "@/components/AnimatedPoints";
import { generateAvatar } from "@/lib/generateAvatar";
import { useToast } from "@/hooks/use-toast";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, type: "spring", stiffness: 300, damping: 26 },
  }),
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const DEFAULT_INTERESTS = [
  { id: "politica", label: "Política", emoji: "🏛️" },
  { id: "esportes", label: "Esportes", emoji: "⚽" },
  { id: "novelas", label: "Novelas", emoji: "📺" },
  { id: "musica", label: "Música", emoji: "🎵" },
  { id: "tecnologia", label: "Tecnologia", emoji: "💻" },
  { id: "humor", label: "Humor", emoji: "😂" },
  { id: "noticias", label: "Notícias", emoji: "📰" },
  { id: "cinema", label: "Cinema", emoji: "🎬" },
];

interface UserProfileProps {
  onNavigate: (page: string) => void;
  onShowPolitician?: () => void;
}

const UserProfile = ({ onNavigate, onShowPolitician }: UserProfileProps) => {
  const { totalPoints } = usePoints();
  const { toast } = useToast();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [isEditing, setIsEditing] = useState(false);
  const [userName, setUserName] = useState(() => localStorage.getItem("beep_user_name") || "Usuário");
  const [editName, setEditName] = useState(userName);
  const [avatar, setAvatar] = useState<string | null>(() => localStorage.getItem("beep_avatar"));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const privacyRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const securityRef = useRef<HTMLDivElement>(null);
  const accessibilityRef = useRef<HTMLDivElement>(null);
  const [interests, setInterests] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("beep_interests") || "[]");
    } catch {
      return [];
    }
  });
  const [notifications, setNotifications] = useState(true);
  const [visibility, setVisibility] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("beep_profile_visibility") || "{}");
      return { name: true, avatar: true, points: true, interests: true, ...stored };
    } catch {
      return { name: true, avatar: true, points: true, interests: true };
    }
  });
  const [notifPrefs, setNotifPrefs] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("beep_notification_prefs") || "{}");
      return { push: true, email: false, sms: false, ...stored };
    } catch {
      return { push: true, email: false, sms: false };
    }
  });
  const [quietHours, setQuietHours] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("beep_quiet_hours") || "{}");
      return { enabled: true, start: "22:00", end: "07:00", ...stored };
    } catch {
      return { enabled: true, start: "22:00", end: "07:00" };
    }
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(() => localStorage.getItem("beep_2fa") === "true");
  const [consents, setConsents] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("beep_consents") || "{}");
      return { marketing: true, personalization: true, dataSharing: false, ...stored };
    } catch {
      return { marketing: true, personalization: true, dataSharing: false };
    }
  });
  const [accessibility, setAccessibility] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("beep_accessibility") || "{}");
      return { fontScale: 100, highContrast: false, ...stored };
    } catch {
      return { fontScale: 100, highContrast: false };
    }
  });
  const [contentPrefs, setContentPrefs] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("beep_content_prefs") || "{}");
      return {
        formats: { radio: true, tv: true, clips: true, podcasts: false },
        discovery: 60,
        depth: 50,
        frequency: "media",
        flags: { live: true, regional: true, exclusive: false, spoilerFree: true },
        ...stored,
      };
    } catch {
      return {
        formats: { radio: true, tv: true, clips: true, podcasts: false },
        discovery: 60,
        depth: 50,
        frequency: "media",
        flags: { live: true, regional: true, exclusive: false, spoilerFree: true },
      };
    }
  });
  const [sessions, setSessions] = useState([
    { id: "current", device: "iPhone 15 Pro", location: "Sao Paulo, BR", lastActive: "Agora", current: true },
    { id: "office", device: "Chrome no Windows", location: "Campinas, BR", lastActive: "Ha 2 horas", current: false },
    { id: "tv", device: "Smart TV Samsung", location: "Santos, BR", lastActive: "Ontem", current: false },
  ]);
  const [accessHistory, setAccessHistory] = useState([
    { id: "1", device: "iPhone 15 Pro", location: "Sao Paulo, BR", ip: "189.40.22.10", time: "Hoje, 08:32", status: "success" },
    { id: "2", device: "Chrome no Windows", location: "Campinas, BR", ip: "189.40.22.10", time: "Ontem, 22:11", status: "success" },
    { id: "3", device: "Smart TV Samsung", location: "Santos, BR", ip: "201.10.40.55", time: "20/03, 19:06", status: "success" },
    { id: "4", device: "Android 14", location: "Rio de Janeiro, BR", ip: "191.90.33.12", time: "19/03, 07:54", status: "blocked" },
  ]);

  const [userBets, setUserBets] = useState<UserBet[]>([]);
  const [allApostas, setAllApostas] = useState<ApostaPreditiva[]>([]);
  const [broadcasterFilter, setBroadcasterFilter] = useState("");
  const [betSortOrder, setBetSortOrder] = useState<"recent" | "oldest" | "name-asc" | "name-desc">(() => {
    const saved = localStorage.getItem("beep_bet_sort_order");
    const validOrders = ["recent", "oldest", "name-asc", "name-desc"];
    if (saved && validOrders.includes(saved)) {
      return saved as "recent" | "oldest" | "name-asc" | "name-desc";
    }
    return "recent";
  });

  const pendingCount = userBets.filter(b => b.status === "pendente").length;
  const wonCount = userBets.filter(b => b.status === "vencida").length;
  const lostCount = userBets.filter(b => b.status === "perdida").length;

  useEffect(() => {
    const checkSortOrder = () => {
      const saved = localStorage.getItem("beep_bet_sort_order");
      const validOrders = ["recent", "oldest", "name-asc", "name-desc"];
      
      if (saved && !validOrders.includes(saved)) {
        localStorage.removeItem("beep_bet_sort_order");
        setBetSortOrder("recent");
        toast({
          title: "Ordenação resetada",
          description: "Um valor inválido foi detectado e a ordenação voltou ao padrão.",
          variant: "destructive",
        });
      } else if (saved && saved !== betSortOrder) {
        setBetSortOrder(saved as any);
      }
    };

    const loadData = () => {
      const savedBets = localStorage.getItem("beep_user_bets");
      if (savedBets) {
        setUserBets(JSON.parse(savedBets));
      }

      const savedApostas = localStorage.getItem("beep_apostas");
      if (savedApostas) {
        setAllApostas(JSON.parse(savedApostas));
      }
      
      checkSortOrder();
    };

    loadData();

    // Sync across tabs/pages
    window.addEventListener("storage", loadData);
    return () => window.removeEventListener("storage", loadData);
  }, [toast]);

  const getBetTitle = (apostaId: string) => {
    const aposta = allApostas.find(a => a.id === apostaId);
    if (aposta) return aposta.titulo;
    if (apostaId.startsWith("match-")) return "Partida Esportiva";
    return "Aposta Desconhecida";
  };

  const getOptionLabel = (bet: UserBet) => {
    const aposta = allApostas.find(a => a.id === bet.apostaId);
    if (aposta) {
      const option = aposta.opcoes.find(o => o.id === bet.opcaoId);
      return option?.label || "Opção Desconhecida";
    }
    // Handle sports matches
    if (bet.apostaId.startsWith("match-")) {
      if (bet.opcaoId === "A") return "Time Casa";
      if (bet.opcaoId === "B") return "Time Fora";
      if (bet.opcaoId === "draw") return "Empate";
    }
    return "Opção Desconhecida";
  };

  const getBetBroadcaster = (apostaId: string) => {
    const aposta = allApostas.find(a => a.id === apostaId);
    return aposta?.emissora || "Não Informada";
  };

  const getBetDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch {
      return "--/--";
    }
  };

  useEffect(() => {
    localStorage.setItem("beep_profile_visibility", JSON.stringify(visibility));
  }, [visibility]);

  useEffect(() => {
    localStorage.setItem("beep_notification_prefs", JSON.stringify(notifPrefs));
  }, [notifPrefs]);

  useEffect(() => {
    localStorage.setItem("beep_quiet_hours", JSON.stringify(quietHours));
  }, [quietHours]);

  useEffect(() => {
    localStorage.setItem("beep_2fa", String(twoFactorEnabled));
  }, [twoFactorEnabled]);

  useEffect(() => {
    localStorage.setItem("beep_consents", JSON.stringify(consents));
  }, [consents]);

  useEffect(() => {
    localStorage.setItem("beep_bet_sort_order", betSortOrder);
  }, [betSortOrder]);

  useEffect(() => {
    localStorage.setItem("beep_accessibility", JSON.stringify(accessibility));
    document.documentElement.style.fontSize = `${accessibility.fontScale}%`;
    document.documentElement.classList.toggle("high-contrast", accessibility.highContrast);
  }, [accessibility]);

  useEffect(() => {
    localStorage.setItem("beep_content_prefs", JSON.stringify(contentPrefs));
  }, [contentPrefs]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return; // max 2MB
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setAvatar(result);
      localStorage.setItem("beep_avatar", result);
    };
    reader.readAsDataURL(file);
  };

  const toggleTheme = useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("beep_theme", next ? "dark" : "light");
  }, [isDark]);

  const saveProfile = () => {
    const trimmed = editName.trim() || "Usuário";
    setUserName(trimmed);
    localStorage.setItem("beep_user_name", trimmed);
    // Regenerate avatar from new name (only if no custom photo)
    const newAvatar = generateAvatar(trimmed);
    setAvatar(newAvatar);
    localStorage.setItem("beep_avatar", newAvatar);
    setIsEditing(false);
  };

  const toggleInterest = (id: string) => {
    setInterests((prev) => {
      const updated = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      localStorage.setItem("beep_interests", JSON.stringify(updated));
      return updated;
    });
  };

  const completionItems = [
    { id: "name", label: "Nome atualizado", done: userName.trim() !== "Usuário" },
    { id: "avatar", label: "Foto adicionada", done: Boolean(avatar) },
    { id: "interests", label: "Gostos escolhidos", done: interests.length > 0 },
    {
      id: "comms",
      label: "Preferências de comunicação",
      done: notifPrefs.push || notifPrefs.email || notifPrefs.sms,
    },
  ];
  const completionPercent = Math.round(
    (completionItems.filter((item) => item.done).length / completionItems.length) * 100,
  );

  const badges = [
    { id: "explorer", label: "Explorador", description: "5 reconhecimentos", progress: 80 },
    { id: "consistency", label: "Consistência", description: "7 dias ativos", progress: 60 },
    { id: "supporter", label: "Apoiador", description: "3 votos", progress: 40 },
  ];

  const handleExportData = () => {
    toast({
      title: "Solicitação enviada",
      description: "Vamos preparar seu arquivo e avisar quando estiver pronto.",
    });
  };

  const scrollToRef = (ref: RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const allInterests = DEFAULT_INTERESTS;

  const menuItems = [
    {
      icon: Bell,
      label: "Notificações",
      toggle: true,
      value: notifications,
      onToggle: () => setNotifications(!notifications),
      onClick: () => scrollToRef(notificationsRef),
    },
    {
      icon: Shield,
      label: "Privacidade e Segurança",
      action: true,
      onClick: () => scrollToRef(privacyRef),
    },
    { icon: HelpCircle, label: "Ajuda e Suporte", action: true },
    { icon: Star, label: "Avalie o BEEP", action: true },
  ];

  return (
    <div className="h-full overflow-y-auto pb-28">
      {/* Header */}
      <div
        className="bg-card-dark relative overflow-hidden"
        style={{ borderBottomLeftRadius: 32, borderBottomRightRadius: 32, paddingBottom: 28 }}
      >
        {/* Glow */}
        <motion.div
          className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, hsl(45 100% 50% / 0.12), transparent 70%)" }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative z-10 px-5 pt-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg font-bold text-card-dark-foreground">Meu Perfil</h1>
            <AnimatedPoints size="sm" />
          </div>

          {/* Avatar & Name */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <motion.div
                className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center overflow-hidden"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {avatar && visibility.avatar ? (
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={28} className="text-primary" />
                )}
              </motion.div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-md border-2 border-card-dark"
              >
                <Camera size={13} className="text-primary-foreground" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="flex gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-10 rounded-xl bg-card border-2 border-border text-sm text-card-dark-foreground"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && saveProfile()}
                  />
                  <Button size="sm" onClick={saveProfile} className="rounded-xl h-10 px-4">
                    Salvar
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <motion.h2
                    className="text-xl font-extrabold text-card-dark-foreground"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    {visibility.name ? userName : "Perfil privado"}
                  </motion.h2>
                  <button
                    onClick={() => {
                      setEditName(userName);
                      setIsEditing(true);
                    }}
                    className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center"
                  >
                    <Edit3 size={13} className="text-primary" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-1.5 mt-1">
                <Trophy size={13} className="text-primary" />
                <span className="text-xs font-bold text-primary">
                  {visibility.points ? `${totalPoints} pontos` : "Pontos ocultos"}
                </span>
              </div>
            </div>
          </div>

          {/* Bet Counters */}
          <motion.div 
            className="grid grid-cols-3 gap-3 mt-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/5 flex flex-col items-center">
              <span className="text-xl font-black text-card-dark-foreground">{pendingCount}</span>
              <span className="text-[10px] uppercase font-bold text-card-dark-foreground/50 tracking-wider">Pendentes</span>
            </div>
            <div className="bg-green-500/10 backdrop-blur-md rounded-2xl p-3 border border-green-500/10 flex flex-col items-center">
              <span className="text-xl font-black text-green-500">{wonCount}</span>
              <span className="text-[10px] uppercase font-bold text-green-500/60 tracking-wider">Vencidas</span>
            </div>
            <div className="bg-red-500/10 backdrop-blur-md rounded-2xl p-3 border border-red-500/10 flex flex-col items-center">
              <span className="text-xl font-black text-red-500">{lostCount}</span>
              <span className="text-[10px] uppercase font-bold text-red-500/60 tracking-wider">Perdidas</span>
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div className="px-5 pt-6 space-y-6" variants={stagger} initial="hidden" animate="show">
        {/* Institutional Access */}
        <motion.div variants={fadeUp} custom={0}>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Acesso Institucional</h3>
          <div className="grid grid-cols-1 gap-3 mb-6">
            <button
              onClick={() => onShowPolitician?.()}
              className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center gap-4 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <LayoutGrid size={24} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">Criador de Apostas</p>
                <p className="text-xs text-muted-foreground">Crie desafios e apostas para a comunidade.</p>
              </div>
              <ChevronRight size={18} className="text-muted-foreground" />
            </button>
          </div>

          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Ações rápidas</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setEditName(userName);
                setIsEditing(true);
              }}
              className="bg-card rounded-2xl border border-border px-3 py-3 flex flex-col items-center gap-2 text-xs font-semibold"
            >
              <Edit3 size={18} className="text-primary" />
              Editar perfil
            </button>
            <button
              onClick={() => scrollToRef(notificationsRef)}
              className="bg-card rounded-2xl border border-border px-3 py-3 flex flex-col items-center gap-2 text-xs font-semibold"
            >
              <Bell size={18} className="text-primary" />
              Comunicação
            </button>
            <button
              onClick={() => scrollToRef(privacyRef)}
              className="bg-card rounded-2xl border border-border px-3 py-3 flex flex-col items-center gap-2 text-xs font-semibold"
            >
              <Eye size={18} className="text-primary" />
              Privacidade
            </button>
            <button
              onClick={() => scrollToRef(securityRef)}
              className="bg-card rounded-2xl border border-border px-3 py-3 flex flex-col items-center gap-2 text-xs font-semibold"
            >
              <Smartphone size={18} className="text-primary" />
              Dispositivos
            </button>
          </div>
        </motion.div>

        {/* Profile Completion */}
        <motion.div variants={fadeUp} custom={1}>
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Complete seu perfil</p>
                <p className="text-xs text-muted-foreground">Ganhe mais relevância nas recomendações.</p>
              </div>
              <span className="text-sm font-bold text-primary">{completionPercent}%</span>
            </div>
            <Progress value={completionPercent} className="h-2 mt-3" />
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              {completionItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2 text-muted-foreground">
                  {item.done ? (
                    <CheckCircle2 size={14} className="text-primary" />
                  ) : (
                    <Circle size={12} className="text-muted-foreground" />
                  )}
                  <span className={item.done ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Minhas Apostas por Status */}
        <motion.div variants={fadeUp} custom={1.5} className="space-y-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Histórico por Status</h3>
            <button 
              onClick={() => onNavigate("bets")}
              className="text-[10px] font-bold text-primary flex items-center gap-0.5"
            >
              VER TODAS <ChevronRight size={10} />
            </button>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text"
                placeholder="Filtrar por emissora..."
                value={broadcasterFilter}
                onChange={(e) => setBroadcasterFilter(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-xl bg-card border border-border text-xs focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className="w-10 h-10 shrink-0 flex items-center justify-center bg-card border border-border rounded-xl text-muted-foreground hover:text-primary transition-colors"
                  title="Opções de ordenação"
                >
                  {betSortOrder === "recent" || betSortOrder === "oldest" ? (
                    <ArrowUpDown size={16} className={betSortOrder === "oldest" ? "rotate-180" : ""} />
                  ) : (
                    betSortOrder === "name-asc" ? <SortAsc size={16} /> : <SortDesc size={16} />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">Ordenar por Data</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setBetSortOrder("recent")} className="text-xs">
                  Mais recentes primeiro
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setBetSortOrder("oldest")} className="text-xs">
                  Mais antigas primeiro
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">Ordenar por Emissora</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setBetSortOrder("name-asc")} className="text-xs">
                  A-Z (Ordem alfabética)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setBetSortOrder("name-desc")} className="text-xs">
                  Z-A (Ordem inversa)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {["pendente", "vencida", "perdida"].map((status) => {
            const filteredBets = userBets
              .filter(b => {
                const matchesStatus = b.status === status;
                const broadcaster = getBetBroadcaster(b.apostaId).toLowerCase();
                const matchesBroadcaster = broadcaster.includes(broadcasterFilter.toLowerCase());
                return matchesStatus && matchesBroadcaster;
              })
              .sort((a, b) => {
                if (betSortOrder === "recent" || betSortOrder === "oldest") {
                  const dateA = new Date(a.data).getTime();
                  const dateB = new Date(b.data).getTime();
                  return betSortOrder === "recent" ? dateB - dateA : dateA - dateB;
                } else {
                  const nameA = getBetBroadcaster(a.apostaId).toLowerCase();
                  const nameB = getBetBroadcaster(b.apostaId).toLowerCase();
                  return betSortOrder === "name-asc" 
                    ? nameA.localeCompare(nameB) 
                    : nameB.localeCompare(nameA);
                }
              });
            if (filteredBets.length === 0) return null;

            return (
              <div key={status} className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <div className={`w-1 h-3 rounded-full ${
                    status === "vencida" ? "bg-green-500" : 
                    status === "perdida" ? "bg-red-500" : "bg-primary"
                  }`} />
                  <h4 className="text-[10px] font-black text-foreground uppercase tracking-widest">
                    {status === "pendente" ? "Aguardando" : status === "vencida" ? "Ganhamos" : "Perdemos"}
                  </h4>
                  <span className="text-[10px] font-bold text-muted-foreground ml-auto">{filteredBets.length}</span>
                </div>
                
                <div className="space-y-2">
                  {filteredBets.slice(0, 2).map((bet) => (
                    <div key={bet.id} className="bg-card/50 rounded-xl border border-border p-3 flex items-center justify-between hover:bg-card transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{getBetTitle(bet.apostaId)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-medium text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded uppercase">
                            {getBetBroadcaster(bet.apostaId)}
                          </span>
                          <span className="text-[9px] font-medium text-muted-foreground">
                            {getBetDate(bet.data)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className={`text-xs font-black tabular-nums ${
                          status === "vencida" ? "text-green-500" : 
                          status === "perdida" ? "text-red-400" : "text-primary"
                        }`}>
                          {status === "vencida" ? `+${bet.retornoPotencial}` : 
                           status === "perdida" ? `-${bet.valor}` : bet.retornoPotencial} 
                          <span className="text-[10px] ml-0.5 font-bold">pts</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {userBets.length > 0 && ["pendente", "vencida", "perdida"].every(status => 
            userBets.filter(b => b.status === status && getBetBroadcaster(b.apostaId).toLowerCase().includes(broadcasterFilter.toLowerCase())).length === 0
          ) && broadcasterFilter && (
            <div className="bg-card/50 rounded-2xl border border-dashed border-border p-8 text-center">
              <p className="text-xs text-muted-foreground">Nenhuma aposta encontrada para "{broadcasterFilter}"</p>
              <button 
                onClick={() => setBroadcasterFilter("")}
                className="mt-2 text-xs font-bold text-primary"
              >
                Limpar filtro
              </button>
            </div>
          )}

          {userBets.length === 0 && (
            <div className="bg-card/50 rounded-2xl border border-dashed border-border p-6 text-center">
              <p className="text-xs text-muted-foreground">Você ainda não fez apostas.</p>
              <button 
                onClick={() => onNavigate("bets")}
                className="mt-2 text-xs font-bold text-primary"
              >
                Começar agora
              </button>
            </div>
          )}
        </motion.div>

        {/* Badges */}
        <motion.div variants={fadeUp} custom={2}>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Marcos e badges</h3>
          <div className="grid gap-3">
            {badges.map((badge) => (
              <div key={badge.id} className="bg-card rounded-2xl border border-border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{badge.label}</p>
                    <p className="text-xs text-muted-foreground">{badge.description}</p>
                  </div>
                  <span className="text-xs font-bold text-primary">{badge.progress}%</span>
                </div>
                <Progress value={badge.progress} className="h-2 mt-3" />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Theme Toggle */}
        <motion.div variants={fadeUp} custom={3}>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Aparência</h3>
          <div className="bg-card rounded-2xl border border-border p-1.5 flex gap-1.5">
            <button
              onClick={() => {
                if (isDark) toggleTheme();
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                !isDark ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sun size={18} />
              Light
            </button>
            <button
              onClick={() => {
                if (!isDark) toggleTheme();
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                isDark ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Moon size={18} />
              Dark
            </button>
          </div>
        </motion.div>

        {/* Interests */}
        <motion.div variants={fadeUp} custom={4}>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Meus Gostos</h3>
          {visibility.interests ? (
            <div className="flex flex-wrap gap-2">
              {allInterests.map((interest) => {
                const selected = interests.includes(interest.id);
                return (
                  <motion.button
                    key={interest.id}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => toggleInterest(interest.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all border-2 ${
                      selected
                        ? "bg-primary/15 border-primary text-primary"
                        : "bg-card border-border text-foreground hover:border-primary/40"
                    }`}
                  >
                    <span>{interest.emoji}</span>
                    <span>{interest.label}</span>
                  </motion.button>
                );
              })}
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border p-4 text-sm text-muted-foreground">
              Seus gostos estão ocultos no perfil público. Ative a visibilidade para editar.
            </div>
          )}
        </motion.div>

        {/* Content Preferences */}
        <motion.div ref={contentRef} variants={fadeUp} custom={5}>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Preferências de conteúdo</h3>
          <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
            <div>
              <p className="text-sm font-semibold">Formatos preferidos</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  { id: "radio", label: "Rádio" },
                  { id: "tv", label: "TV" },
                  { id: "clips", label: "Clipes" },
                  { id: "podcasts", label: "Podcasts" },
                ].map((format) => {
                  const selected = contentPrefs.formats[format.id as keyof typeof contentPrefs.formats];
                  return (
                    <button
                      key={format.id}
                      onClick={() =>
                        setContentPrefs({
                          ...contentPrefs,
                          formats: { ...contentPrefs.formats, [format.id]: !selected },
                        })
                      }
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                        selected
                          ? "bg-primary/15 border-primary text-primary"
                          : "bg-background border-border text-foreground hover:border-primary/40"
                      }`}
                    >
                      {format.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Novidades vs. conhecidos</p>
                <span className="text-xs font-semibold text-primary">{contentPrefs.discovery}%</span>
              </div>
              <Slider
                className="mt-3"
                min={0}
                max={100}
                step={5}
                value={[contentPrefs.discovery]}
                onValueChange={(value) => setContentPrefs({ ...contentPrefs, discovery: value[0] })}
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Profundidade do conteúdo</p>
                <span className="text-xs font-semibold text-primary">{contentPrefs.depth}%</span>
              </div>
              <Slider
                className="mt-3"
                min={0}
                max={100}
                step={5}
                value={[contentPrefs.depth]}
                onValueChange={(value) => setContentPrefs({ ...contentPrefs, depth: value[0] })}
              />
            </div>
            <div>
              <p className="text-sm font-semibold">Frequência de recomendações</p>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[
                  { id: "baixa", label: "Baixa" },
                  { id: "media", label: "Média" },
                  { id: "alta", label: "Alta" },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setContentPrefs({ ...contentPrefs, frequency: option.id })}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      contentPrefs.frequency === option.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {[
                { id: "live", label: "Priorizar conteúdo ao vivo" },
                { id: "regional", label: "Dar destaque ao conteúdo local" },
                { id: "exclusive", label: "Exclusivos e bastidores" },
                { id: "spoilerFree", label: "Evitar spoilers" },
              ].map((flag) => (
                <div key={flag.id} className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{flag.label}</p>
                  <Switch
                    checked={contentPrefs.flags[flag.id as keyof typeof contentPrefs.flags]}
                    onCheckedChange={(value) =>
                      setContentPrefs({
                        ...contentPrefs,
                        flags: { ...contentPrefs.flags, [flag.id]: value },
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Communication Preferences */}
        <motion.div ref={notificationsRef} variants={fadeUp} custom={6}>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Preferências de comunicação</h3>
          <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                <Bell size={18} className="text-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Push no app</p>
                <p className="text-xs text-muted-foreground">Alertas em tempo real.</p>
              </div>
              <Switch checked={notifPrefs.push} onCheckedChange={(value) => setNotifPrefs({ ...notifPrefs, push: value })} />
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                <Mail size={18} className="text-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">E-mail</p>
                <p className="text-xs text-muted-foreground">Relatórios e novidades.</p>
              </div>
              <Switch checked={notifPrefs.email} onCheckedChange={(value) => setNotifPrefs({ ...notifPrefs, email: value })} />
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                <MessageSquare size={18} className="text-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">SMS</p>
                <p className="text-xs text-muted-foreground">Alertas críticos.</p>
              </div>
              <Switch checked={notifPrefs.sms} onCheckedChange={(value) => setNotifPrefs({ ...notifPrefs, sms: value })} />
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4 mt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Silenciar em horário</p>
                <p className="text-xs text-muted-foreground">Evite notificações tarde da noite.</p>
              </div>
              <Switch checked={quietHours.enabled} onCheckedChange={(value) => setQuietHours({ ...quietHours, enabled: value })} />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Início</label>
                <Input
                  type="time"
                  value={quietHours.start}
                  onChange={(e) => setQuietHours({ ...quietHours, start: e.target.value })}
                  className="h-10 rounded-xl bg-background"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Fim</label>
                <Input
                  type="time"
                  value={quietHours.end}
                  onChange={(e) => setQuietHours({ ...quietHours, end: e.target.value })}
                  className="h-10 rounded-xl bg-background"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Privacy and Visibility */}
        <motion.div ref={privacyRef} variants={fadeUp} custom={7}>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Privacidade e visibilidade</h3>
          <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                {visibility.name ? <Eye size={18} className="text-foreground" /> : <EyeOff size={18} className="text-muted-foreground" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Nome público</p>
                <p className="text-xs text-muted-foreground">Exibir seu nome no perfil.</p>
              </div>
              <Switch checked={visibility.name} onCheckedChange={(value) => setVisibility({ ...visibility, name: value })} />
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                {visibility.avatar ? <Eye size={18} className="text-foreground" /> : <EyeOff size={18} className="text-muted-foreground" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Foto de perfil</p>
                <p className="text-xs text-muted-foreground">Mostrar seu avatar.</p>
              </div>
              <Switch checked={visibility.avatar} onCheckedChange={(value) => setVisibility({ ...visibility, avatar: value })} />
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                {visibility.points ? <Eye size={18} className="text-foreground" /> : <EyeOff size={18} className="text-muted-foreground" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Pontuação</p>
                <p className="text-xs text-muted-foreground">Exibir seus pontos.</p>
              </div>
              <Switch checked={visibility.points} onCheckedChange={(value) => setVisibility({ ...visibility, points: value })} />
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                {visibility.interests ? <Eye size={18} className="text-foreground" /> : <EyeOff size={18} className="text-muted-foreground" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Gostos</p>
                <p className="text-xs text-muted-foreground">Mostrar interesses selecionados.</p>
              </div>
              <Switch checked={visibility.interests} onCheckedChange={(value) => setVisibility({ ...visibility, interests: value })} />
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4 mt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Pré-visualização pública</p>
                <p className="text-xs text-muted-foreground">Veja como outros enxergam seu perfil.</p>
              </div>
              <button className="text-xs font-semibold text-primary">Ver agora</button>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center overflow-hidden">
                {visibility.avatar && avatar ? (
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={22} className="text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {visibility.name ? userName : "Perfil privado"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {visibility.points ? `${totalPoints} pontos` : "Pontuação oculta"}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Security */}
        <motion.div ref={securityRef} variants={fadeUp} custom={8}>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Segurança</h3>
          <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                <KeyRound size={18} className="text-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Autenticação em duas etapas</p>
                <p className="text-xs text-muted-foreground">Proteção extra na conta.</p>
              </div>
              <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4 mt-3">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold">Dispositivos conectados</p>
                <p className="text-xs text-muted-foreground">Controle de sessões ativas.</p>
              </div>
              <ShieldCheck size={18} className="text-primary" />
            </div>
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <Smartphone size={18} className="text-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{session.device}</p>
                    <p className="text-xs text-muted-foreground">
                      {session.location} • {session.lastActive}
                    </p>
                  </div>
                  {session.current ? (
                    <span className="text-xs font-semibold text-primary">Este dispositivo</span>
                  ) : (
                    <button
                      onClick={() => setSessions((prev) => prev.filter((item) => item.id !== session.id))}
                      className="text-xs font-semibold text-destructive"
                    >
                      Encerrar
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4 mt-3">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold">Histórico de acessos</p>
                <p className="text-xs text-muted-foreground">Atividades recentes da conta.</p>
              </div>
              <button
                onClick={() => setAccessHistory((prev) => prev.slice(0, 2))}
                className="text-xs font-semibold text-primary"
              >
                Limpar antigos
              </button>
            </div>
            <div className="space-y-3">
              {accessHistory.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <Smartphone size={18} className="text-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{entry.device}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.location} • {entry.time} • {entry.ip}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      entry.status === "success" ? "text-primary" : "text-destructive"
                    }`}
                  >
                    {entry.status === "success" ? "Acesso ok" : "Bloqueado"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Consent and Data */}
        <motion.div variants={fadeUp} custom={9}>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Dados e consentimentos</h3>
          <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                <Mail size={18} className="text-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Marketing e novidades</p>
                <p className="text-xs text-muted-foreground">Receber ofertas e comunicados.</p>
              </div>
              <Switch checked={consents.marketing} onCheckedChange={(value) => setConsents({ ...consents, marketing: value })} />
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                <LayoutGrid size={18} className="text-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Personalização de conteúdo</p>
                <p className="text-xs text-muted-foreground">Recomendações mais relevantes.</p>
              </div>
              <Switch
                checked={consents.personalization}
                onCheckedChange={(value) => setConsents({ ...consents, personalization: value })}
              />
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                <Shield size={18} className="text-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Compartilhar dados anônimos</p>
                <p className="text-xs text-muted-foreground">Melhorar o produto.</p>
              </div>
              <Switch checked={consents.dataSharing} onCheckedChange={(value) => setConsents({ ...consents, dataSharing: value })} />
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4 mt-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Exportar meus dados</p>
              <p className="text-xs text-muted-foreground">Baixe um arquivo com suas informações.</p>
            </div>
            <Button size="sm" variant="outline" onClick={handleExportData} className="rounded-xl">
              <Download size={14} className="mr-2" />
              Exportar
            </Button>
          </div>
        </motion.div>

        {/* Accessibility */}
        <motion.div ref={accessibilityRef} variants={fadeUp} custom={10}>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Acessibilidade</h3>
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Alto contraste</p>
                <p className="text-xs text-muted-foreground">Aumenta a legibilidade.</p>
              </div>
              <Switch checked={accessibility.highContrast} onCheckedChange={(value) => setAccessibility({ ...accessibility, highContrast: value })} />
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Tamanho da fonte</p>
                <span className="text-xs font-semibold text-primary">{accessibility.fontScale}%</span>
              </div>
              <Slider
                className="mt-3"
                min={90}
                max={120}
                step={5}
                value={[accessibility.fontScale]}
                onValueChange={(value) => setAccessibility({ ...accessibility, fontScale: value[0] })}
              />
            </div>
          </div>
        </motion.div>

        {/* Settings Menu */}
        <motion.div variants={fadeUp} custom={11}>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Configurações</h3>
          <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
            {menuItems.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-3 px-4 py-3.5 ${item.onClick ? "cursor-pointer hover:bg-muted/40" : ""}`}
                onClick={item.onClick}
              >
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <item.icon size={18} className="text-foreground" />
                </div>
                <span className="flex-1 text-sm font-semibold text-foreground">{item.label}</span>
                {item.toggle ? (
                  <Switch checked={item.value} onCheckedChange={item.onToggle} />
                ) : (
                  <ChevronRight size={16} className="text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Logout */}
        <motion.div variants={fadeUp} custom={12} className="pb-4">
          <button className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors">
            <LogOut size={18} />
            Sair da conta
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default UserProfile;
