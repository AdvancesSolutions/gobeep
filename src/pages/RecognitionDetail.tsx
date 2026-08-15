import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, Share2, X, CalendarPlus, Star, ChevronRight, Phone, Music, Clock, Disc3, Search, Play, Pause, Radio, Tv } from "lucide-react";
import { motion } from "framer-motion";
import { getStation, sessions, stations } from "@/data/stations";
import { toast } from "sonner";
import beepLogo from "@/assets/beep-logo.png";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 30 } },
};

const RecognitionDetail = ({ onNavigate, stationId, sessionId }: { onNavigate: (page: string, stationId?: string) => void; stationId: string; sessionId: number }) => {
  const [search, setSearch] = useState("");
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const station = getStation(stationId) || stations[0];
  const session = sessions.find((s) => s.id === sessionId) || sessions[0];
  const isTV = station.type === "tv";

  const stopPlayback = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setPlayingIndex(null);
    setProgress(0);
  }, []);

  const togglePlay = useCallback((index: number) => {
    if (playingIndex === index) {
      stopPlayback();
      return;
    }
    stopPlayback();
    setPlayingIndex(index);
    setProgress(0);
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          stopPlayback();
          return 0;
        }
        return p + 2;
      });
    }, 100);
  }, [playingIndex, stopPlayback]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const radioTracks = [
    { title: "Blinding Lights", artist: "The Weeknd", time: "14:03", duration: "3:22", genre: "Synthwave" },
    { title: "Levitating", artist: "Dua Lipa", time: "14:07", duration: "3:23", genre: "Disco Pop" },
    { title: "Peaches", artist: "Justin Bieber", time: "14:12", duration: "3:18", genre: "R&B" },
    { title: "Stay", artist: "The Kid LAROI", time: "14:18", duration: "2:21", genre: "Pop Rap" },
  ];

  const tvTracks = [
    { title: "Tema de Abertura", artist: "Novela das 9", time: "21:00", duration: "1:30", genre: "Trilha Sonora" },
    { title: "Comercial Coca-Cola", artist: "Anúncio", time: "21:15", duration: "0:30", genre: "Comercial" },
    { title: "Vinheta Jornal", artist: "TV Globo", time: "20:00", duration: "0:15", genre: "Vinheta" },
    { title: "As It Was", artist: "Harry Styles", time: "21:32", duration: "2:47", genre: "Pop" },
    { title: "Comercial Itaú", artist: "Anúncio", time: "21:45", duration: "0:30", genre: "Comercial" },
  ];

  const tracks = isTV ? tvTracks : radioTracks;

  const filteredTracks = tracks.filter((t) => {
    const q = search.toLowerCase();
    return t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q);
  });

  const StationIcon = isTV ? Tv : Radio;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="bg-card-dark text-card-dark-foreground px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate("home")} className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
              <ChevronLeft size={20} className="text-primary-foreground" />
            </button>
            <img src={beepLogo} alt="BEEP" className="w-5 h-5 object-contain" />
            <span className="text-muted-foreground/40 text-sm font-light">|</span>
            <span className="text-sm font-medium opacity-80">Jan 17, Sábado</span>
          </div>
          <span className="text-xs font-medium bg-card-dark-foreground/10 rounded-full px-3 py-1">{session.time}</span>
        </div>

        {/* Recognition Card */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="bg-card rounded-2xl p-5 text-card-foreground relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full -translate-y-8 translate-x-8" />
          <div className="relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Reconhecimento</p>
                <h2 className="text-xl font-bold">{station.name}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{session.duration} de gravação • {session.tracks} faixas</p>
              </div>
              <div className="bg-card-dark text-card-dark-foreground rounded-xl px-3 py-2 text-center">
                {isTV ? (
                  <>
                    <Tv size={20} className="text-primary mx-auto" />
                    <p className="text-[10px] font-medium opacity-70 mt-0.5">{station.freq}</p>
                  </>
                ) : (
                  <>
                    <span className="text-lg font-extrabold leading-none">{station.freq.replace(" FM", "")}</span>
                    <p className="text-[10px] font-medium opacity-70 mt-0.5">FM</p>
                  </>
                )}
              </div>
            </div>

            {/* Waveform visual */}
            <div className="flex items-end gap-[3px] mt-4 h-8">
              {Array.from({ length: 40 }).map((_, i) => {
                const h = Math.random() * 100;
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-full bg-primary/30"
                    style={{ height: `${Math.max(15, h)}%` }}
                  />
                );
              })}
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <StationIcon size={14} className="text-primary-foreground" />
                </div>
                <div>
                  <span className="font-semibold text-sm">{station.name}</span>
                  <p className="text-[11px] text-muted-foreground">{station.location?.split(" - ")[1] || "Brasil"}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-primary rounded-full px-2.5 py-1">
                <Star size={12} className="text-primary-foreground fill-primary-foreground" />
                <span className="text-xs font-bold text-primary-foreground">{station.rating}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <motion.div className="flex justify-center gap-6 py-5 border-b border-border" variants={stagger} initial="hidden" animate="show">
        {[
          { icon: Share2, label: "Compartilhar", dark: false, action: () => toast.success("Link copiado para a área de transferência!") },
          { icon: X, label: "Descartar", dark: true, action: () => { toast("Sessão descartada"); onNavigate("home"); } },
          { icon: CalendarPlus, label: "Salvar", dark: false, action: () => toast.success("Sessão salva com sucesso!") },
        ].map((action) => (
          <motion.button key={action.label} variants={fadeUp} onClick={action.action} className="flex flex-col items-center gap-2">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-transform active:scale-95 ${
              action.dark
                ? "bg-card-dark text-card-dark-foreground"
                : "bg-primary text-primary-foreground"
            }`}>
              <action.icon size={22} />
            </div>
            <span className="text-xs font-medium text-foreground">{action.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Tracks Identified */}
      <div className="px-4 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-base">{isTV ? "Conteúdo Identificado" : "Faixas Identificadas"}</h3>
          <span className="text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-0.5 font-semibold">
            {filteredTracks.length} {isTV ? "itens" : "músicas"}
          </span>
        </div>

        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isTV ? "Buscar conteúdo..." : "Buscar música ou artista..."}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <motion.div className="space-y-1" variants={stagger} initial="hidden" animate="show">
          {filteredTracks.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">Nenhuma faixa encontrada.</p>
          )}
          {filteredTracks.map((track, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <button
                onClick={() => togglePlay(i)}
                className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 relative overflow-hidden transition-colors hover:bg-primary/25"
              >
                {playingIndex === i && (
                  <div
                    className="absolute bottom-0 left-0 w-full bg-primary/30 transition-all"
                    style={{ height: `${progress}%` }}
                  />
                )}
                {playingIndex === i ? (
                  <Pause size={16} className="text-primary relative z-10" />
                ) : (
                  <Play size={16} className="text-primary relative z-10 ml-0.5" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{track.title}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                  <span className="text-[10px] font-medium bg-accent text-accent-foreground rounded-full px-2 py-0.5 shrink-0">
                    {track.genre}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-medium text-foreground">{track.time}</p>
                <p className="text-[11px] text-muted-foreground">{track.duration}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Station Info */}
      <motion.div className="px-4 mt-4" variants={stagger} initial="hidden" animate="show">
        <motion.button
          variants={fadeUp}
          onClick={() => onNavigate("profile", stationId)}
          className="w-full flex items-center justify-between py-3 px-4 bg-card rounded-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <StationIcon size={18} className="text-muted-foreground" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm">{station.name}</p>
              <p className="text-xs text-muted-foreground">{station.location?.split(" - ")[0] || station.freq}</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-muted-foreground" />
        </motion.button>

        <motion.button variants={fadeUp} className="w-full bg-card-dark text-card-dark-foreground rounded-2xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2 mt-3">
          <Phone size={16} />
          {station.phone || "Sem telefone"}
        </motion.button>

        <motion.button
          variants={fadeUp}
          onClick={() => onNavigate("recognition")}
          className="w-full bg-primary text-primary-foreground rounded-2xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2 mt-3"
        >
          <Disc3 size={16} />
          Reconhecimento em Tempo Real
        </motion.button>
      </motion.div>

      {/* Reviews */}
      <motion.div className="px-4 mt-5 pb-4" variants={stagger} initial="hidden" animate="show">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base">Avaliações</h3>
          <span className="text-sm text-muted-foreground">
            Ordenar por <span className="font-semibold text-foreground">Data ▾</span>
          </span>
        </div>

        {[
          { name: "Ana Silva", date: "Jan 1, 2026", text: isTV ? "Identificou perfeitamente os comerciais e vinhetas da programação. Excelente!" : "App incrível! Identificou todas as músicas que estavam tocando na rádio. Super preciso e rápido.", initial: "A" },
          { name: "Carlos M.", date: "Dez 28, 2025", text: isTV ? "Ótimo para monitorar conteúdo televisivo. Reconhece trilhas e comerciais." : "Muito bom para monitoramento de emissoras. Recomendo!", initial: "C" },
        ].map((review, i) => (
          <motion.div key={i} variants={fadeUp} className="flex items-start gap-3 mb-5">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
              {review.initial}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{review.name}</span>
                <span className="text-xs text-muted-foreground">{review.date}</span>
              </div>
              <div className="flex gap-0.5 my-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={12} className="text-primary fill-primary" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{review.text}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="h-24" />
    </div>
  );
};

export default RecognitionDetail;
