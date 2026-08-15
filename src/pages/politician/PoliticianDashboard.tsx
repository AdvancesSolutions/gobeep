import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Plus, User, ArrowLeft, ListChecks, Flame, LayoutDashboard } from "lucide-react";
import { cargoLabels, cargoIcons, type CargoType, type GabineteProfile } from "@/data/politicians";
import PoliticianProfile from "./PoliticianProfile";
import PoliticianPolls from "./PoliticianPolls";
import PoliticianPollCreate from "./PoliticianPollCreate";
import PoliticianBetCreate from "./PoliticianBetCreate";
import PoliticianBetDashboard from "./PoliticianBetDashboard";

type Tab = "pesquisas" | "criar" | "apostas" | "resultados" | "perfil";

const tabs = [
  { id: "pesquisas" as Tab, label: "Pesquisas", icon: ListChecks },
  { id: "criar" as Tab, label: "Nova", icon: Plus },
  { id: "apostas" as Tab, label: "Apostas", icon: Flame },
  { id: "resultados" as Tab, label: "Resultados", icon: LayoutDashboard },
  { id: "perfil" as Tab, label: "Perfil", icon: User },
];

const PoliticianDashboard = ({ onBack }: { onBack: () => void }) => {
  const [gabinete, setGabinete] = useState<GabineteProfile | null>(() => {
    const saved = localStorage.getItem("beep_gabinete");
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState<Tab>("pesquisas");

  const saveGabinete = (profile: GabineteProfile) => {
    setGabinete(profile);
    localStorage.setItem("beep_gabinete", JSON.stringify(profile));
  };

  // Setup screen - choose cargo type
  if (!gabinete) {
    return <PoliticianSetup onBack={onBack} onComplete={saveGabinete} />;
  }

  const renderTab = () => {
    switch (activeTab) {
      case "pesquisas":
        return <PoliticianPolls gabinete={gabinete} />;
      case "criar":
        return <PoliticianPollCreate gabinete={gabinete} onCreated={() => setActiveTab("pesquisas")} />;
      case "apostas":
        return <PoliticianBetCreate gabinete={gabinete} onCreated={() => setActiveTab("resultados")} />;
      case "resultados":
        return <PoliticianBetDashboard gabinete={gabinete} />;
      case "perfil":
        return <PoliticianProfile gabinete={gabinete} onSave={saveGabinete} onLogout={() => { localStorage.removeItem("beep_gabinete"); setGabinete(null); }} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border px-4 pt-4 pb-2">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft size={16} className="text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-black text-foreground tracking-tight">Criador de Conteúdo</h1>
            <p className="text-xs text-muted-foreground">{gabinete.nome} · Especialista</p>
          </div>
          <span className="text-2xl">{cargoIcons[gabinete.cargo]}</span>
        </div>

        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderTab()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// Setup component
const PoliticianSetup = ({ onBack, onComplete }: { onBack: () => void; onComplete: (p: GabineteProfile) => void }) => {
  const [selectedCargo, setSelectedCargo] = useState<CargoType | null>(null);
  const [nome, setNome] = useState("");
  const [partido, setPartido] = useState("");
  const [estado, setEstado] = useState("");
  const [contato, setContato] = useState("");

  const cargos = Object.entries(cargoLabels) as [CargoType, string][];

  if (!selectedCargo) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <button onClick={onBack} className="absolute top-4 left-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft size={16} className="text-foreground" />
          </button>
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎯</span>
          </div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Criador Beep</h1>
          <p className="text-sm text-muted-foreground mt-2">Escolha seu perfil de criação</p>
        </motion.div>

        <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
          {cargos.map(([key, label], i) => (
            <motion.button
              key={key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedCargo(key)}
              className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all text-left"
            >
              <span className="text-2xl">{cargoIcons[key]}</span>
              <span className="font-semibold text-foreground">{label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    if (!nome || !partido || !estado || !contato) return;
    onComplete({
      id: crypto.randomUUID(),
      nome,
      cargo: selectedCargo,
      partido,
      estado,
      contato,
    });
  };

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <button onClick={() => setSelectedCargo(null)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mb-6">
        <ArrowLeft size={16} className="text-foreground" />
      </button>

      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">{cargoIcons[selectedCargo]}</span>
        <div>
          <h1 className="text-xl font-black text-foreground">Cadastro do Gabinete</h1>
          <p className="text-sm text-muted-foreground">{cargoLabels[selectedCargo]}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Nome do Candidato / Político</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" className="w-full h-11 rounded-xl border border-input bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 outline-none" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Partido</label>
          <select value={partido} onChange={(e) => setPartido(e.target.value)} className="w-full h-11 rounded-xl border border-input bg-card px-4 text-sm text-foreground focus:ring-2 focus:ring-primary/50 outline-none">
            <option value="">Selecione</option>
            {["PL","PT","PP","UNIÃO","MDB","PSD","REPUBLICANOS","PDT","PSDB","PSB","PODE","PSOL","AVANTE","CIDADANIA","PV","NOVO","REDE","PCdoB","SOLIDARIEDADE","PROS"].map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Estado</label>
          <select value={estado} onChange={(e) => setEstado(e.target.value)} className="w-full h-11 rounded-xl border border-input bg-card px-4 text-sm text-foreground focus:ring-2 focus:ring-primary/50 outline-none">
            <option value="">Selecione</option>
            {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Contato (e-mail ou telefone)</label>
          <input value={contato} onChange={(e) => setContato(e.target.value)} placeholder="contato@gabinete.com" className="w-full h-11 rounded-xl border border-input bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 outline-none" />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!nome || !partido || !estado || !contato}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-40 transition-all mt-4"
        >
          Criar Gabinete
        </button>
      </div>
    </div>
  );
};

export default PoliticianDashboard;
