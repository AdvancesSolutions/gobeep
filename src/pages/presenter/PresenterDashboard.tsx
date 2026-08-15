import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, MessageSquare, Calendar, User, ArrowLeft, ChevronDown } from "lucide-react";
import { broadcasters, programs as allPrograms, type Broadcaster } from "@/data/broadcasters";
import PresenterAudience from "./PresenterAudience";
import PresenterPolls from "./PresenterPolls";
import PresenterSchedule from "./PresenterSchedule";
import PresenterProfilePage from "./PresenterProfilePage";

type Tab = "audience" | "polls" | "schedule" | "profile";

const tabs = [
  { id: "audience" as Tab, label: "Audiência", icon: BarChart3 },
  { id: "polls" as Tab, label: "Interações", icon: MessageSquare },
  { id: "schedule" as Tab, label: "Agenda", icon: Calendar },
  { id: "profile" as Tab, label: "Perfil", icon: User },
];

const PresenterDashboard = ({ onBack }: { onBack: () => void }) => {
  const [selectedBroadcaster, setSelectedBroadcaster] = useState<Broadcaster | null>(null);
  const [selectedHost, setSelectedHost] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("audience");
  const [showPicker, setShowPicker] = useState(false);

  // Step 1: Select broadcaster
  if (!selectedBroadcaster) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-card-dark flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎤</span>
          </div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Painel do Apresentador</h1>
          <p className="text-sm text-muted-foreground mt-2">Selecione sua emissora</p>
        </motion.div>

        <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
          {broadcasters.map((b, i) => (
            <motion.button
              key={b.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, type: "spring", stiffness: 300, damping: 25 }}
              onClick={() => setSelectedBroadcaster(b)}
              className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border text-left active:scale-[0.98] transition-all hover:border-primary/40"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${b.color}20` }}>
                {b.logo}
              </div>
              <div>
                <p className="font-bold text-foreground">{b.name}</p>
                <p className="text-xs text-muted-foreground">Entrar como apresentador</p>
              </div>
            </motion.button>
          ))}
        </div>

        <button onClick={onBack} className="mt-8 text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors">
          <ArrowLeft size={14} /> Voltar ao app
        </button>
      </div>
    );
  }

  // Step 2: Select host/presenter
  const broadcasterPrograms = allPrograms.filter((p) => p.broadcasterId === selectedBroadcaster.id);
  const hosts = [...new Set(broadcasterPrograms.map((p) => p.host))];

  if (!selectedHost) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="text-3xl mb-3">{selectedBroadcaster.logo}</div>
          <h1 className="text-xl font-black text-foreground">Quem é você?</h1>
          <p className="text-sm text-muted-foreground mt-1">Selecione seu nome</p>
        </motion.div>

        <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
          {hosts.map((host, i) => (
            <motion.button
              key={host}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => setSelectedHost(host)}
              className="flex items-center gap-3 p-3.5 bg-card rounded-2xl border border-border text-left active:scale-[0.98] transition-all hover:border-primary/40"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-lg">🎤</div>
              <div>
                <p className="text-sm font-bold text-foreground">{host}</p>
                <p className="text-[10px] text-muted-foreground">
                  {broadcasterPrograms.filter((p) => p.host === host).map((p) => p.name).join(", ")}
                </p>
              </div>
            </motion.button>
          ))}
        </div>

        <button onClick={() => setSelectedBroadcaster(null)} className="mt-6 text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors">
          <ArrowLeft size={14} /> Trocar emissora
        </button>
      </div>
    );
  }

  const presenterPrograms = broadcasterPrograms.filter((p) => p.host === selectedHost);

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Top bar */}
      <div className="bg-card-dark px-4 pt-10 pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-8 h-8 rounded-lg bg-card-dark-foreground/10 flex items-center justify-center">
              <ArrowLeft size={16} className="text-card-dark-foreground/70" />
            </button>
            <div>
              <p className="text-[10px] text-card-dark-foreground/40 uppercase tracking-wider font-medium">Apresentador</p>
              <button onClick={() => setShowPicker(!showPicker)} className="flex items-center gap-1.5 mt-0.5">
                <span className="text-lg">{selectedBroadcaster.logo}</span>
                <span className="text-base font-black text-card-dark-foreground">{selectedHost}</span>
                <ChevronDown size={14} className="text-card-dark-foreground/50" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/15">
            <span className="text-lg">🎤</span>
          </div>
        </div>

        <AnimatePresence>
          {showPicker && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3">
              <div className="flex gap-2 pb-2 flex-wrap">
                {hosts.map((h) => (
                  <button
                    key={h}
                    onClick={() => { setSelectedHost(h); setShowPicker(false); }}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      h === selectedHost ? "bg-card-dark-foreground/20 text-card-dark-foreground" : "bg-card-dark-foreground/5 text-card-dark-foreground/50"
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-28">
        <AnimatePresence mode="wait">
          {activeTab === "audience" && (
            <motion.div key="audience" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <PresenterAudience programs={presenterPrograms} />
            </motion.div>
          )}
          {activeTab === "polls" && (
            <motion.div key="polls" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <PresenterPolls />
            </motion.div>
          )}
          {activeTab === "schedule" && (
            <motion.div key="schedule" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <PresenterSchedule programs={presenterPrograms} />
            </motion.div>
          )}
          {activeTab === "profile" && (
            <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <PresenterProfilePage
                hostName={selectedHost}
                programs={presenterPrograms}
                onUpdateName={(name) => setSelectedHost(name)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Tab Bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2.5rem)] max-w-[22rem]">
        <nav className="flex items-center justify-around bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl py-2.5 px-4 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-[0_4px_16px_hsl(var(--primary)/0.4)] scale-110"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {isActive ? (
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
                    <Icon size={20} strokeWidth={2.5} />
                  </motion.div>
                ) : (
                  <Icon size={20} strokeWidth={1.5} />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default PresenterDashboard;
