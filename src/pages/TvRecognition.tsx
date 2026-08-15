import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Square, Tv, X } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import PointsCelebration from "@/components/PointsCelebration";
import { usePoints } from "@/contexts/PointsContext";

const TvRecognition = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
  const { addPoints } = usePoints();
  const [isCapturing, setIsCapturing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [detectedPrograms, setDetectedPrograms] = useState<{ title: string; channel: string; time: string }[]>([]);
  const [celebration, setCelebration] = useState<{ open: boolean; points: number; title: string; description: string }>({
    open: false, points: 0, title: "", description: "",
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const startCapture = async () => {
    try {
      // CRITICAL: getUserMedia called directly in click handler
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCapturing(true);
      setElapsed(0);
      setDetectedPrograms([]);

      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);

      // Simulated detections
      setTimeout(() => {
        const program = { title: "Jornal Nacional", channel: "TV Globo", time: "00:06" };
        setDetectedPrograms((prev) => [...prev, program]);
        setCelebration({
          open: true, points: 20, title: "Programa Detectado!",
          description: `Você identificou "${program.title}" na ${program.channel}. Continue assistindo para ganhar mais pontos!`,
        });
      }, 6000);

      setTimeout(() => {
        const program = { title: "Fantástico", channel: "TV Globo", time: "00:14" };
        setDetectedPrograms((prev) => [...prev, program]);
        setCelebration({
          open: true, points: 20, title: "Mais um Programa!",
          description: `"${program.title}" na ${program.channel} reconhecido. Você está arrasando!`,
        });
      }, 14000);
    } catch (error) {
      if (error instanceof Error && error.name === "NotAllowedError") {
        console.error("Camera access denied");
      } else {
        console.error("Error accessing camera:", error);
      }
    }
  };

  const stopCapture = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCapturing(false);
  }, []);

  useEffect(() => {
    return () => { stopCapture(); };
  }, [stopCapture]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader title="TV — Imagem" onBack={() => { stopCapture(); onNavigate("home"); }} />

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Camera preview */}
        <div className="relative w-full max-w-xs aspect-video rounded-2xl overflow-hidden bg-muted mb-6 border border-border">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          {!isCapturing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <Camera size={40} className="opacity-40 mb-2" />
              <p className="text-sm">Aponte para a TV</p>
            </div>
          )}
          {isCapturing && (
            <div className="absolute top-3 right-3 bg-destructive text-destructive-foreground text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-destructive-foreground" />
              REC
            </div>
          )}
        </div>

        {/* Capture button */}
        <div className="relative flex items-center justify-center mb-4">
          <AnimatePresence>
            {isCapturing && (
              <>
                {[1, 2, 3].map((ring) => (
                  <motion.div
                    key={ring}
                    className="absolute rounded-full border-2 border-accent/30"
                    initial={{ width: 80, height: 80, opacity: 0.6 }}
                    animate={{ width: 80 + ring * 40, height: 80 + ring * 40, opacity: 0 }}
                    transition={{ duration: 2, repeat: Infinity, delay: ring * 0.4, ease: "easeOut" }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>

          <motion.button
            onClick={isCapturing ? stopCapture : startCapture}
            className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-colors ${
              isCapturing
                ? "bg-destructive text-destructive-foreground"
                : "bg-accent text-accent-foreground"
            }`}
            whileTap={{ scale: 0.92 }}
          >
            {isCapturing ? <Square size={28} /> : <Camera size={28} />}
          </motion.button>
        </div>

        <p className="text-sm font-medium text-muted-foreground mb-1">
          {isCapturing ? "Capturando..." : "Toque para iniciar"}
        </p>
        {isCapturing && (
          <motion.p
            className="text-2xl font-bold text-foreground tabular-nums"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {formatTime(elapsed)}
          </motion.p>
        )}
      </div>

      {/* Detected programs */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground">Programas Detectados</h3>
          <span className="text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-0.5 font-semibold">
            {detectedPrograms.length} programas
          </span>
        </div>

        <AnimatePresence>
          {detectedPrograms.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-6 text-muted-foreground">
              <Tv size={28} className="mb-2 opacity-40" />
              <p className="text-sm">Nenhum programa detectado ainda</p>
            </motion.div>
          ) : (
            <div className="space-y-1">
              {detectedPrograms.map((program, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center">
                    <Tv size={18} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate text-foreground">{program.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{program.channel}</p>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{program.time}</span>
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

export default TvRecognition;
