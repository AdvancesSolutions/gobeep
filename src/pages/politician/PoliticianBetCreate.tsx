import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Flame, Plus, Trash2, Calendar, Layout, AlignLeft, Info, Headphones } from "lucide-react";
import { type GabineteProfile, type ApostaPreditiva, type ApostaOpcao } from "@/data/politicians";

const categories = [
  { id: "politica", label: "Política", icon: "🏛️" },
  { id: "entretenimento", label: "Entretenimento", icon: "🍿" },
  { id: "esportes", label: "Esportes", icon: "⚽" },
  { id: "tecnologia", label: "Tecnologia", icon: "💻" },
  { id: "economia", label: "Economia", icon: "📈" },
  { id: "games", label: "Games", icon: "🎮" },
  { id: "geral", label: "Geral", icon: "🌍" },
];

const PoliticianBetCreate = ({ gabinete, onCreated }: { gabinete: GabineteProfile; onCreated: () => void }) => {
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("geral");
  const [emissora, setEmissora] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataLimite, setDataLimite] = useState("");
  const [opcoes, setOpcoes] = useState<ApostaOpcao[]>([
    { id: crypto.randomUUID(), label: "", odds: 2.0 },
    { id: crypto.randomUUID(), label: "", odds: 2.0 },
  ]);

  const addOpcao = () => {
    if (opcoes.length >= 6) return;
    setOpcoes([...opcoes, { id: crypto.randomUUID(), label: "", odds: 2.0 }]);
  };

  const removeOpcao = (id: string) => {
    if (opcoes.length <= 2) return;
    setOpcoes(opcoes.filter(o => o.id !== id));
  };

  const updateOpcao = (id: string, field: keyof ApostaOpcao, value: string | number) => {
    setOpcoes(opcoes.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const isValid = titulo && categoria && dataLimite && opcoes.length >= 2 && opcoes.every(o => o.label.trim() !== "" && o.odds > 0);

  const handleSave = (status: "ativa" | "rascunho") => {
    const aposta: ApostaPreditiva = {
      id: crypto.randomUUID(),
      titulo,
      categoria,
      emissora,
      descricao,
      opcoes,
      dataLimite,
      status,
      criadoEm: new Date().toISOString(),
      criadoPor: gabinete.id,
    };

    const existing = JSON.parse(localStorage.getItem("beep_apostas") || "[]");
    existing.push(aposta);
    localStorage.setItem("beep_apostas", JSON.stringify(existing));
    onCreated();
  };

  const inputClass = "w-full h-12 rounded-xl border border-input bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all";
  const labelClass = "text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5";

  return (
    <div className="px-4 pt-4 pb-12 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Flame size={20} className="text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-black text-foreground">Nova Aposta Preditiva</h2>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Formulário de Criação Completo</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Título e Categoria */}
        <div className="space-y-4">
          <div>
            <label className={labelClass}><Layout size={12} /> Título da Aposta</label>
            <input 
              value={titulo} 
              onChange={e => setTitulo(e.target.value)} 
              placeholder="Ex: Quem ganhará o Oscar de Melhor Filme?" 
              className={inputClass} 
            />
          </div>

          <div>
            <label className={labelClass}><Info size={12} /> Tema / Categoria</label>
            <div className="grid grid-cols-2 gap-2">
              <select 
                value={categoria} 
                onChange={e => setCategoria(e.target.value)} 
                className={inputClass}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
                ))}
              </select>
              <div className="relative">
                <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input 
                  type="datetime-local" 
                  value={dataLimite} 
                  onChange={e => setDataLimite(e.target.value)} 
                  className={`${inputClass} pl-10`} 
                />
          </div>
          <div>
            <label className={labelClass}><Headphones size={12} /> Emissora / Canal</label>
            <input 
              value={emissora} 
              onChange={e => setEmissora(e.target.value)} 
              placeholder="Ex: TV Globo, Rádio Cidade..." 
              className={inputClass} 
            />
          </div>
        </div>
          </div>
        </div>

        {/* Descrição */}
        <div>
          <label className={labelClass}><AlignLeft size={12} /> Descrição e Regras</label>
          <textarea 
            value={descricao} 
            onChange={e => setDescricao(e.target.value)} 
            placeholder="Detalhes sobre como a aposta será resolvida..." 
            className="w-full min-h-[100px] rounded-xl border border-input bg-card p-4 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 outline-none resize-none transition-all"
          />
        </div>

        {/* Opções Dinâmicas */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className={labelClass}>Opções de Resultado</label>
            <button 
              onClick={addOpcao}
              disabled={opcoes.length >= 6}
              className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-primary/20 transition-colors disabled:opacity-50"
            >
              <Plus size={10} /> ADICIONAR
            </button>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {opcoes.map((opcao, index) => (
                <motion.div 
                  key={opcao.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-muted/40 p-3 rounded-xl border border-border flex gap-3 items-end"
                >
                  <div className="flex-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase mb-1 block">Opção {index + 1}</label>
                    <input 
                      value={opcao.label} 
                      onChange={e => updateOpcao(opcao.id, "label", e.target.value)} 
                      placeholder="Ex: Filme A" 
                      className={`${inputClass} h-10`} 
                    />
                  </div>
                  <div className="w-24">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase mb-1 block">Odds</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      value={opcao.odds} 
                      onChange={e => updateOpcao(opcao.id, "odds", parseFloat(e.target.value) || 0)} 
                      className={`${inputClass} h-10 px-2 text-center`} 
                    />
                  </div>
                  {opcoes.length > 2 && (
                    <button 
                      onClick={() => removeOpcao(opcao.id)}
                      className="h-10 w-10 shrink-0 bg-destructive/10 text-destructive rounded-xl flex items-center justify-center hover:bg-destructive/20 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={() => handleSave("rascunho")}
            disabled={!titulo}
            className="flex-1 h-14 rounded-2xl border border-border bg-card text-foreground font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2 hover:bg-muted transition-colors"
          >
            <Save size={16} /> Rascunho
          </button>
          <button
            onClick={() => handleSave("ativa")}
            disabled={!isValid}
            className="flex-[1.5] h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2 shadow-[0_8px_24px_hsl(var(--primary)/0.3)] hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <Flame size={18} /> Publicar Desafio
          </button>
        </div>
      </div>
    </div>
  );
};

export default PoliticianBetCreate;