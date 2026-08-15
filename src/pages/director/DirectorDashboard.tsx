import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Calendar, Tv, BarChart3, ArrowLeft, ChevronDown } from "lucide-react";
import { broadcasters, type Broadcaster } from "@/data/broadcasters";
import DashboardOverview from "./DashboardOverview";
import ScheduleGrid from "./ScheduleGrid";
import ProgramsList from "./ProgramsList";
import ProgramDetail from "./ProgramDetail";

type Tab = "overview" | "schedule" | "programs";

const tabs = [
  { id: "overview" as Tab, label: "Audiência", icon: BarChart3 },
  { id: "schedule" as Tab, label: "Grade", icon: Calendar },
  { id: "programs" as Tab, label: "Programas", icon: Tv },
];

const DirectorDashboard = ({ onBack }: { onBack: () => void }) => {
  const [selectedBroadcaster, setSelectedBroadcaster] = useState<Broadcaster | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showPicker, setShowPicker] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);

  // Broadcaster selection screen
  if (!selectedBroadcaster) {
    return (
      <div className="h-full bg-background flex flex-col items-center justify-center px-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="w-16 h-16 rounded-2xl bg-card-dark flex items-center justify-center mx-auto mb-4">
            <Tv size={28} className="text-primary" />
          </div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Painel do Diretor</h1>
          <p className="text-sm text-muted-foreground mt-2">Selecione sua emissora para começar</p>
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
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ background: `${b.color}20` }}
              >
                {b.logo}
              </div>
              <div>
                <p className="font-bold text-foreground">{b.name}</p>
                <p className="text-xs text-muted-foreground">Gerenciar como diretor</p>
              </div>
            </motion.button>
          ))}
        </div>

        <button
          onClick={onBack}
          className="mt-8 text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} /> Voltar ao app
        </button>
      </div>
    );
  }

  // Program detail view
  if (selectedProgramId) {
    return (
      <ProgramDetail
        programId={selectedProgramId}
        broadcaster={selectedBroadcaster}
        onBack={() => setSelectedProgramId(null)}
      />
    );
  }

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
              <p className="text-[10px] text-card-dark-foreground/40 uppercase tracking-wider font-medium">Painel do Diretor</p>
              <button
                onClick={() => setShowPicker(!showPicker)}
                className="flex items-center gap-1.5 mt-0.5"
              >
                <span className="text-lg">{selectedBroadcaster.logo}</span>
                <span className="text-lg font-black text-card-dark-foreground">{selectedBroadcaster.shortName}</span>
                <ChevronDown size={14} className="text-card-dark-foreground/50" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: `${selectedBroadcaster.color}20` }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: selectedBroadcaster.color }} />
            <span className="text-[10px] font-bold" style={{ color: selectedBroadcaster.color }}>AO VIVO</span>
          </div>
        </div>

        {/* Broadcaster picker dropdown */}
        <AnimatePresence>
          {showPicker && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-3"
            >
              <div className="flex gap-2 pb-2">
                {broadcasters.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => { setSelectedBroadcaster(b); setShowPicker(false); }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      b.id === selectedBroadcaster.id
                        ? "bg-card-dark-foreground/20 text-card-dark-foreground"
                        : "bg-card-dark-foreground/5 text-card-dark-foreground/50"
                    }`}
                  >
                    <span>{b.logo}</span>
                    <span>{b.shortName}</span>
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
          {activeTab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <DashboardOverview broadcaster={selectedBroadcaster} />
            </motion.div>
          )}
          {activeTab === "schedule" && (
            <motion.div key="schedule" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <ScheduleGrid broadcaster={selectedBroadcaster} />
            </motion.div>
          )}
          {activeTab === "programs" && (
            <motion.div key="programs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <ProgramsList
                broadcaster={selectedBroadcaster}
                onSelectProgram={(id) => setSelectedProgramId(id)}
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
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Icon size={20} strokeWidth={2.5} />
                  </motion.div>
                ) : (
                  <Icon size={20} strokeWidth={1.5} />
                )}
              </button>
            );
          })}
          {/* Back button */}
          <button
            onClick={onBack}
            className="relative w-12 h-12 rounded-2xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-300"
          >
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>
        </nav>
      </div>
    </div>
  );
};

export default DirectorDashboard;
