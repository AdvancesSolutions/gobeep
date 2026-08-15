import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Save } from "lucide-react";
import { type GabineteProfile, type PesquisaIntencao, type Candidato, type CargoType, cargoLabels, partidosBrasil } from "@/data/politicians";

const PoliticianPollCreate = ({ gabinete, onCreated }: { gabinete: GabineteProfile; onCreated: () => void }) => {
  const [titulo, setTitulo] = useState("");
  const [cargo, setCargo] = useState<CargoType>(gabinete.cargo);
  const [regiao, setRegiao] = useState(gabinete.estado);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [candidatos, setCandidatos] = useState<Candidato[]>([
    { id: crypto.randomUUID(), nome: "", partido: "", numero: 0 },
    { id: crypto.randomUUID(), nome: "", partido: "", numero: 0 },
  ]);

  const addCandidato = () => {
    setCandidatos([...candidatos, { id: crypto.randomUUID(), nome: "", partido: "", numero: 0 }]);
  };

  const removeCandidato = (id: string) => {
    if (candidatos.length <= 2) return;
    setCandidatos(candidatos.filter(c => c.id !== id));
  };

  const updateCandidato = (id: string, field: keyof Candidato, value: string | number) => {
    setCandidatos(candidatos.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const isValid = titulo && regiao && dataInicio && dataFim && candidatos.every(c => c.nome && c.partido && c.numero);

  const handleSave = (status: "ativa" | "rascunho") => {
    const pesquisa: PesquisaIntencao = {
      id: crypto.randomUUID(),
      titulo,
      cargo,
      regiao,
      dataInicio,
      dataFim,
      candidatos,
      votos: Object.fromEntries(candidatos.map(c => [c.id, Math.floor(Math.random() * 500)])), // simulated
      status,
      criadoEm: new Date().toISOString(),
    };

    const existing = JSON.parse(localStorage.getItem("beep_pesquisas") || "[]");
    existing.push(pesquisa);
    localStorage.setItem("beep_pesquisas", JSON.stringify(existing));
    onCreated();
  };

  const inputClass = "w-full h-11 rounded-xl border border-input bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 outline-none";

  return (
    <div className="px-4 pt-4 pb-8">
      <h2 className="text-lg font-black text-foreground mb-4">Nova Pesquisa</h2>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Título da Pesquisa</label>
          <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Pesquisa Eleitoral 2026" className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Cargo</label>
            <select value={cargo} onChange={e => setCargo(e.target.value as CargoType)} className={inputClass}>
              {Object.entries(cargoLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Região</label>
            <input value={regiao} onChange={e => setRegiao(e.target.value)} placeholder="SP, Nacional..." className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Data Início</label>
            <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Data Fim</label>
            <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className={inputClass} />
          </div>
        </div>

        {/* Candidatos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-bold text-foreground">Candidatos</label>
            <button onClick={addCandidato} className="text-xs font-semibold text-primary flex items-center gap-1">
              <Plus size={12} /> Adicionar
            </button>
          </div>

          <div className="space-y-3">
            {candidatos.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-muted/50 rounded-xl p-3 border border-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-muted-foreground">Candidato {i + 1}</span>
                  {candidatos.length > 2 && (
                    <button onClick={() => removeCandidato(c.id)} className="text-destructive">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  <input
                    value={c.nome}
                    onChange={e => updateCandidato(c.id, "nome", e.target.value)}
                    placeholder="Nome do candidato"
                    className={inputClass}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={c.partido}
                      onChange={e => updateCandidato(c.id, "partido", e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Partido</option>
                      {partidosBrasil.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <input
                      type="number"
                      value={c.numero || ""}
                      onChange={e => updateCandidato(c.id, "numero", parseInt(e.target.value) || 0)}
                      placeholder="Nº"
                      className={inputClass}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => handleSave("rascunho")}
            disabled={!titulo}
            className="flex-1 h-12 rounded-xl border border-border bg-card text-foreground font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <Save size={14} /> Rascunho
          </button>
          <button
            onClick={() => handleSave("ativa")}
            disabled={!isValid}
            className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
          >
            Publicar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PoliticianPollCreate;
