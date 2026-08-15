import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Radio, Music, ChevronLeft } from "lucide-react";

import { toast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";
import PointsCelebration from "@/components/PointsCelebration";
import { usePoints } from "@/contexts/PointsContext";

const NUM_BARS = 32;

const RealTimeRecognition = ({ onNavigate }: { onNavigate: (page: string, stationId?: string) => void }) => {
  const { addPoints } = usePoints();
  const [isListening, setIsListening] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [detectedTracks, setDetectedTracks] = useState<{ title: string; artist: string; time: string }[]>([]);
  const [celebration, setCelebration] = useState<{ open: boolean; points: number; title: string; description: string }>({
    open: false, points: 0, title: "", description: "",
  });
  const [bars, setBars] = useState<number[]>(Array(NUM_BARS).fill(8));
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const visualize = useCallback(() => {
    if (!analyserRef.current) return;
    const analyser = analyserRef.current;
    const data = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      analyser.getByteFrequencyData(data);
      const step = Math.floor(data.length / NUM_BARS);
      const newBars = Array.from({ length: NUM_BARS }, (_, i) => {
        const val = data[i * step] || 0;
        return Math.max(8, (val / 255) * 100);
      });
      setBars(newBars);
      animFrameRef.current = requestAnimationFrame(draw);
    };
    draw();
  }, []);

  const startListening = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const recorder = new MediaRecorder(stream);
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        audioCtx.close();
      };
      mediaRecorderRef.current = recorder;
      recorder.start();

      setIsListening(true);
      setElapsed(0);
      setDetectedTracks([]);

      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);

      visualize();

      setTimeout(() => {
        const track = { title: "Blinding Lights", artist: "The Weeknd", time: "00:05" };
        setDetectedTracks((prev) => [...prev, track]);
        setCelebration({
          open: true, points: 15, title: "Faixa Detectada!",
          description: `Você identificou "${track.title}" de ${track.artist}. Continue escutando para ganhar mais pontos!`,
        });
      }, 5000);
      setTimeout(() => {
        const track = { title: "Levitating", artist: "Dua Lipa", time: "00:12" };
        setDetectedTracks((prev) => [...prev, track]);
        setCelebration({
          open: true, points: 15, title: "Mais uma Faixa!",
          description: `"${track.title}" de ${track.artist} reconhecida. Você está arrasando!`,
        });
      }, 12000);
    } catch {
      console.error("Microphone access denied");
    }
  };

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    setBars(Array(NUM_BARS).fill(8));
    setIsListening(false);
  }, []);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <PageHeader title="Reconhecimento" onBack={() => { stopListening(); onNavigate("home"); }} />

      {/* Main area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Pulse rings behind button */}
        <div className="relative flex items-center justify-center mb-8">
          <AnimatePresence>
            {isListening && (
              <>
                {[1, 2, 3].map((ring) => (
                  <motion.div
                    key={ring}
                    className="absolute rounded-full border-2 border-primary/30"
                    initial={{ width: 120, height: 120, opacity: 0.6 }}
                    animate={{
                      width: 120 + ring * 60,
                      height: 120 + ring * 60,
                      opacity: 0,
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: ring * 0.4,
                      ease: "easeOut",
                    }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>

          <motion.button
            onClick={isListening ? stopListening : startListening}
            className={`relative z-10 w-28 h-28 rounded-full flex items-center justify-center shadow-lg transition-colors ${
              isListening
                ? "bg-destructive text-destructive-foreground"
                : "bg-primary text-primary-foreground"
            }`}
            whileTap={{ scale: 0.92 }}
          >
            {isListening ? <Square size={36} /> : <Mic size={36} />}
          </motion.button>
        </div>

        <p className="text-sm font-medium text-muted-foreground mb-1">
          {isListening ? "Escutando..." : "Toque para iniciar"}
        </p>
        {isListening && (
          <motion.p
            className="text-2xl font-bold text-foreground tabular-nums"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {formatTime(elapsed)}
          </motion.p>
        )}

        {/* Sound wave visualizer */}
        <div className="w-full mt-8 flex items-end justify-center gap-[2px] h-20">
          {bars.map((h, i) => (
            <motion.div
              key={i}
              className="flex-1 max-w-[6px] rounded-full bg-primary/60"
              animate={{ height: `${h}%` }}
              transition={{ duration: 0.08, ease: "easeOut" }}
            />
          ))}
        </div>
      </div>

      {/* Detected tracks */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground">Faixas Detectadas</h3>
          <span className="text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-0.5 font-semibold">
            {detectedTracks.length} músicas
          </span>
        </div>

        <AnimatePresence>
          {detectedTracks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center py-6 text-muted-foreground"
            >
              <Radio size={28} className="mb-2 opacity-40" />
              <p className="text-sm">Nenhuma faixa detectada ainda</p>
            </motion.div>
          ) : (
            <div className="space-y-1">
              {detectedTracks.map((track, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                    <Music size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate text-foreground">{track.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{track.time}</span>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="h-24" />

      <PointsCelebration
        open={celebration.open}
        points={celebration.points}
        title={celebration.title}
        description={celebration.description}
        onContinue={() => {
          addPoints(celebration.points);
          setCelebration((prev) => ({ ...prev, open: false }));
        }}
      />
    </div>
  );
};

export default RealTimeRecognition;
