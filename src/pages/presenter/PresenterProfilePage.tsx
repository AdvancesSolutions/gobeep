import { useState } from "react";
import { motion } from "framer-motion";
import { Edit3, Users, Clock, Tv, Camera } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { type TvProgram } from "@/data/broadcasters";

interface Props {
  hostName: string;
  programs: TvProgram[];
  onUpdateName: (name: string) => void;
}

const PresenterProfilePage = ({ hostName, programs, onUpdateName }: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(hostName);
  const [bio, setBio] = useState(() => localStorage.getItem("beep_presenter_bio") || "Apresentador de televisão apaixonado pelo que faz. Conectando pessoas através da informação e entretenimento.");
  const [editBio, setEditBio] = useState(bio);

  const save = () => {
    const trimmedName = editName.trim() || hostName;
    const trimmedBio = editBio.trim() || bio;
    onUpdateName(trimmedName);
    setBio(trimmedBio);
    localStorage.setItem("beep_presenter_bio", trimmedBio);
    setIsEditing(false);
  };

  const totalAudience = programs.reduce((sum, p) => sum + p.currentAudience, 0);

  return (
    <div className="px-4 pt-4 space-y-5">
      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border p-5"
      >
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-primary/15 flex items-center justify-center text-3xl">
              🎤
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-md border-2 border-card">
              <Camera size={13} className="text-primary-foreground" />
            </button>
          </div>
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-9 rounded-xl text-sm"
                  placeholder="Seu nome"
                  autoFocus
                />
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full h-20 rounded-xl border border-input bg-background px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Sua bio..."
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={save} className="rounded-xl h-8 px-4 text-xs">Salvar</Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} className="rounded-xl h-8 px-4 text-xs">Cancelar</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-foreground">{hostName}</h2>
                  <button
                    onClick={() => { setEditName(hostName); setEditBio(bio); setIsEditing(true); }}
                    className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center"
                  >
                    <Edit3 size={13} className="text-primary" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{bio}</p>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Programas", value: programs.length, icon: Tv },
          { label: "Audiência", value: `${totalAudience.toFixed(1)}%`, icon: Users },
          { label: "Anos no ar", value: "12", icon: Clock },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className="bg-card rounded-2xl border border-border p-3 text-center"
            >
              <Icon size={18} className="text-primary mx-auto mb-1.5" />
              <p className="text-lg font-black text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground font-medium">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Programs List */}
      <div>
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Meus Programas</h3>
        <div className="space-y-2">
          {programs.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.06 }}
              className="bg-card rounded-xl border border-border p-3 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Tv size={18} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">{p.name}</p>
                <p className="text-[10px] text-muted-foreground">{p.genre} • {p.startTime}-{p.endTime}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                p.status === "ao-vivo" ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
              }`}>
                {p.status === "ao-vivo" ? "AO VIVO" : p.status.toUpperCase()}
              </span>
            </motion.div>
          ))}
          {programs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum programa vinculado.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PresenterProfilePage;
