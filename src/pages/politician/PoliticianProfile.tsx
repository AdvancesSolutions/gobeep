import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { LogOut, Save, Camera, ImagePlus } from "lucide-react";
import { type GabineteProfile, type CargoType, cargoLabels, cargoIcons, partidosBrasil, estadosBrasil, partidoCores } from "@/data/politicians";
import { generateAvatar } from "@/lib/generateAvatar";

const PoliticianProfile = ({
  gabinete,
  onSave,
  onLogout,
}: {
  gabinete: GabineteProfile;
  onSave: (p: GabineteProfile) => void;
  onLogout: () => void;
}) => {
  const [nome, setNome] = useState(gabinete.nome);
  const [cargo, setCargo] = useState<CargoType>(gabinete.cargo);
  const [partido, setPartido] = useState(gabinete.partido);
  const [estado, setEstado] = useState(gabinete.estado);
  const [contato, setContato] = useState(gabinete.contato);
  const [foto, setFoto] = useState(gabinete.foto || "");
  const [bannerUrl, setBannerUrl] = useState(gabinete.bannerUrl || "");
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onSave({ ...gabinete, nome, cargo, partido, estado, contato, foto: foto || undefined, bannerUrl: bannerUrl || undefined });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  };

  const colors = partidoCores[partido] || ["hsl(var(--primary))", "hsl(var(--primary))"];
  const avatarSrc = foto || generateAvatar(nome || "G", 128);

  const inputClass = "w-full h-11 rounded-xl border border-input bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 outline-none";

  return (
    <div className="pb-8">
      {/* Banner header with party colors */}
      <div
        className="relative h-36 rounded-b-3xl overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}
      >
        {bannerUrl && (
          <img src={bannerUrl} alt="Banner" className="absolute inset-0 w-full h-full object-cover opacity-60" />
        )}
        <button
          onClick={() => bannerInputRef.current?.click()}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white"
        >
          <ImagePlus size={14} />
        </button>
        <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, setBannerUrl)} />

        {/* Avatar */}
        <div className="absolute -bottom-10 left-4">
          <div className="relative">
            <img
              src={avatarSrc}
              alt={nome}
              className="w-20 h-20 rounded-2xl border-4 object-cover"
              style={{ borderColor: colors[0] }}
            />
            <button
              onClick={() => fotoInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
            >
              <Camera size={12} />
            </button>
            <input ref={fotoInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, setFoto)} />
          </div>
        </div>
      </div>

      {/* Name & role below banner */}
      <div className="px-4 pt-14 pb-2">
        <h2 className="text-lg font-black text-foreground">{nome || "Gabinete"}</h2>
        <p className="text-sm text-muted-foreground">{cargoLabels[cargo]} · {partido} · {estado}</p>
      </div>

      {/* Form */}
      <div className="px-4 space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Nome</label>
          <input value={nome} onChange={e => setNome(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Cargo</label>
          <select value={cargo} onChange={e => setCargo(e.target.value as CargoType)} className={inputClass}>
            {Object.entries(cargoLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Partido</label>
          <select value={partido} onChange={e => setPartido(e.target.value)} className={inputClass}>
            {partidosBrasil.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Estado</label>
          <select value={estado} onChange={e => setEstado(e.target.value)} className={inputClass}>
            {estadosBrasil.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Contato</label>
          <input value={contato} onChange={e => setContato(e.target.value)} className={inputClass} />
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 mt-2"
        >
          <Save size={14} /> Salvar Alterações
        </motion.button>

        <button
          onClick={onLogout}
          className="w-full h-12 rounded-xl border border-destructive text-destructive font-bold text-sm flex items-center justify-center gap-2"
        >
          <LogOut size={14} /> Sair do Gabinete
        </button>
      </div>
    </div>
  );
};

export default PoliticianProfile;
