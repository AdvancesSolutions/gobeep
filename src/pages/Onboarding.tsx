import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Sparkles, ChevronRight, Plus, X, Check, Trophy, Sun, Moon, Radio, Tv, Music, Headphones, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { usePoints } from "@/contexts/PointsContext";
import { generateAvatar } from "@/lib/generateAvatar";

const DEFAULT_INTERESTS = [
  { id: "politica", label: "Política", emoji: "🏛️" },
  { id: "esportes", label: "Esportes", emoji: "⚽" },
  { id: "novelas", label: "Novelas", emoji: "📺" },
  { id: "musica", label: "Música", emoji: "🎵" },
  { id: "tecnologia", label: "Tecnologia", emoji: "💻" },
  { id: "humor", label: "Humor", emoji: "😂" },
  { id: "noticias", label: "Notícias", emoji: "📰" },
  { id: "cinema", label: "Cinema", emoji: "🎬" },
];

const POINTS_NAME = 30;
const POINTS_PER_INTEREST = 10;
const MAX_INTEREST_POINTS = 80;

const stepVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0, transition: { type: "spring", stiffness: 300, damping: 30 } }),
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, type: "spring", stiffness: 300, damping: 26 },
  }),
};

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding = ({ onComplete }: OnboardingProps) => {
  const [step, setStep] = useState(-1); // -1 = splash
  const [direction, setDirection] = useState(1);
  const [name, setName] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customInterests, setCustomInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [splashExiting, setSplashExiting] = useState(false);
  const [bigSmile, setBigSmile] = useState(false);
  const { addPoints } = usePoints();

  const toggleTheme = useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("beep_theme", next ? "dark" : "light");
  }, [isDark]);

  const allInterests = [
    ...DEFAULT_INTERESTS,
    ...customInterests.map((c) => ({ id: c, label: c, emoji: "✨" })),
  ];

  const totalSelected = selectedInterests.length;
  const nameCompleted = name.trim().length > 0;
  const interestPoints = Math.min(totalSelected * POINTS_PER_INTEREST, MAX_INTEREST_POINTS);
  const namePoints = nameCompleted ? POINTS_NAME : 0;
  const totalPossiblePoints = namePoints + interestPoints;

  // Progress: splash=-1 (no bar), step 0 = name, step 1 = interests, step 2 = done
  const progress =
    step <= -1
      ? 0
      : step === 0
        ? nameCompleted ? 33 : 5
        : step === 1
          ? 33 + Math.min(totalSelected * 8, 57)
          : 100;

  const playBuzz = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
      osc.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.2);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  }, []);

  const goNext = () => {
    if (step === -1) {
      // Trigger big smile + buzz, then splash exit
      setBigSmile(true);
      playBuzz();
      setTimeout(() => {
        setSplashExiting(true);
        setTimeout(() => {
          setSplashExiting(false);
          setBigSmile(false);
          setDirection(1);
          setStep(0);
        }, 800);
      }, 700);
    } else if (step === 0 && nameCompleted) {
      const pts = POINTS_NAME;
      if (earnedPoints < pts) {
        setEarnedPoints(pts);
      }
      setDirection(1);
      setStep(1);
    } else if (step === 1) {
      setDirection(1);
      setStep(2);
    }
  };

  const goBack = () => {
    if (step > -1) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const addCustomInterest = () => {
    const trimmed = newInterest.trim();
    if (trimmed && !customInterests.includes(trimmed)) {
      setCustomInterests((prev) => [...prev, trimmed]);
      setSelectedInterests((prev) => [...prev, trimmed]);
      setNewInterest("");
    }
  };

  const handleFinish = useCallback(() => {
    const finalPoints = namePoints + interestPoints;
    addPoints(finalPoints);
    localStorage.setItem("beep_onboarded", "true");
    localStorage.setItem("beep_user_name", name.trim());
    localStorage.setItem("beep_interests", JSON.stringify(selectedInterests));
    // Generate avatar from name if no custom photo uploaded
    if (!localStorage.getItem("beep_avatar")) {
      localStorage.setItem("beep_avatar", generateAvatar(name.trim()));
    }
    onComplete();
  }, [namePoints, interestPoints, addPoints, name, selectedInterests, onComplete]);

  return (
    <div className="h-full flex flex-col relative overflow-hidden" style={{ background: step === 0 ? "linear-gradient(180deg, hsl(45 100% 50%), hsl(40 90% 45%))" : undefined }} >
      {step !== 0 && step !== -1 && <div className="absolute inset-0 bg-background" />}
      {/* Botão temporário para pular onboarding */}
      <button
        onClick={() => {
          localStorage.setItem("beep_onboarded", "true");
          onComplete();
        }}
        className="absolute top-4 right-4 z-50 text-xs font-bold text-muted-foreground bg-muted/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border/50"
      >
        Pular →
      </button>
      {/* Animated glow orbs */}
      <motion.div
        className="absolute -top-20 -right-20 w-56 h-56 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(45 100% 50% / 0.15), transparent 70%)" }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-32 -left-20 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(45 100% 50% / 0.1), transparent 70%)" }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Animated floating hexagons background — only on step 0 */}
      {step === 0 && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {[
            { x: "5%", y: "20%", size: 60, delay: 0, dur: 8 },
            { x: "80%", y: "10%", size: 40, delay: 1, dur: 10 },
            { x: "60%", y: "60%", size: 50, delay: 2, dur: 7 },
            { x: "15%", y: "75%", size: 35, delay: 0.5, dur: 9 },
            { x: "90%", y: "50%", size: 45, delay: 1.5, dur: 11 },
            { x: "40%", y: "30%", size: 30, delay: 3, dur: 6 },
            { x: "70%", y: "85%", size: 55, delay: 0.8, dur: 8 },
          ].map(({ x, y, size, delay, dur }, i) => (
            <motion.div
              key={`hex-${i}`}
              className="absolute rounded-2xl"
              style={{
                left: x,
                top: y,
                width: size,
                height: size,
                background: "hsl(30 50% 15% / 0.06)",
                rotate: "45deg",
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 0.7, 0.3],
                rotate: ["45deg", "90deg", "45deg"],
              }}
              transition={{ duration: dur, repeat: Infinity, delay, ease: "easeInOut" }}
            />
          ))}
        </div>
      )}

      {/* Top bar - hidden on splash */}
      {step >= 0 && (
      <div className="px-5 pt-6 pb-2 relative z-10">
        <div className="flex items-center justify-between mb-4">
            <motion.img
            src="/lovable-uploads/10b5b969-cd90-4dfd-bde3-b9436600a3d6.png"
            alt="Logo"
            className="w-28 h-auto max-h-12 object-contain"
            style={{ filter: step === 0 ? "drop-shadow(0 2px 6px hsl(30 50% 15% / 0.25))" : undefined }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
          />
          <motion.div
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
            style={{
              background: step === 0 ? "hsl(30 50% 15% / 0.15)" : undefined,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <Trophy size={14} style={{ color: step === 0 ? "hsl(30 50% 15%)" : undefined }} className={step !== 0 ? "text-primary" : ""} />
            <span className="text-xs font-bold tabular-nums" style={{ color: step === 0 ? "hsl(30 50% 15%)" : undefined }}>{totalPossiblePoints} pts</span>
          </motion.div>
        </div>

        {/* Progress bar — segmented steps */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex gap-2">
            {[0, 1, 2].map((s) => (
              <div
                key={s}
                className="flex-1 h-3 rounded-full overflow-hidden"
                style={{
                  background: step === 0 ? "hsl(30 50% 15% / 0.15)" : "hsl(var(--muted))",
                }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: step === 0 ? "hsl(30 50% 15% / 0.7)" : "hsl(var(--primary))",
                  }}
                  initial={{ width: "0%" }}
                  animate={{
                    width: s < step ? "100%" : s === step ? (s === 0 ? (nameCompleted ? "100%" : "30%") : s === 1 ? `${Math.min(totalSelected * 14, 100)}%` : "100%") : "0%",
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[11px] font-semibold" style={{ color: step === 0 ? "hsl(30 50% 15% / 0.6)" : undefined }}>
              {step === 0 ? "Seu nome" : step === 1 ? "Seus gostos" : "Pronto!"}
            </span>
            <span className="text-[11px] font-bold" style={{ color: step === 0 ? "hsl(30 50% 15% / 0.8)" : undefined }}>
              {step + 1}/3
            </span>
          </div>
        </motion.div>
      </div>
      )}

      {/* Steps */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          {/* Splash screen — Bee-themed animated */}
          {step === -1 && (
            <motion.div
              key="splash"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0 flex flex-col items-center justify-between"
              style={{ background: "linear-gradient(180deg, hsl(0 0% 8%), hsl(0 0% 5%))" }}
            >
              {/* Top section — Logo */}
              <motion.div 
                className="flex-1 flex flex-col items-center justify-center w-full px-8 relative"
                animate={splashExiting ? { opacity: 0, scale: 0.9 } : { opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                {/* Floating particles */}
                {Array.from({ length: 12 }).map((_, i) => {
                  const size = 3 + Math.random() * 6;
                  const left = `${5 + Math.random() * 90}%`;
                  const top = `${5 + Math.random() * 90}%`;
                  const delay = i * 0.2;
                  const dur = 4 + Math.random() * 4;
                  return (
                    <motion.div
                      key={`particle-${i}`}
                      className="absolute rounded-full pointer-events-none"
                      style={{
                        left,
                        top,
                        width: size,
                        height: size,
                        background: `hsl(45 100% ${50 + Math.random() * 20}% / ${0.2 + Math.random() * 0.4})`,
                      }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{
                        opacity: [0, 0.8, 0],
                        scale: [0, 1.5, 0],
                        y: [0, -40 - Math.random() * 60],
                        x: [0, (Math.random() - 0.5) * 40],
                      }}
                      transition={{ duration: dur, repeat: Infinity, delay, ease: "easeInOut" }}
                    />
                  );
                })}

                {/* Ring pulse behind logo — responsive sizes */}
                {[0, 1, 2].map((i) => {
                  const baseMobile = 80 + i * 40;
                  const baseTablet = 110 + i * 54;
                  const baseDesktop = 140 + i * 64;
                  return (
                    <motion.div
                      key={`ring-${i}`}
                      className="absolute rounded-full border pointer-events-none"
                      style={{
                        width: `clamp(${baseMobile}px, ${baseTablet / 7.68}vw, ${baseDesktop}px)`,
                        height: `clamp(${baseMobile}px, ${baseTablet / 7.68}vw, ${baseDesktop}px)`,
                        borderColor: `hsl(45 100% 50% / ${0.12 - i * 0.03})`,
                      }}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: [0, 0.6, 0], scale: [0.5, 1.2, 0.5] }}
                      transition={{ duration: 3, repeat: Infinity, delay: i * 0.8, ease: "easeInOut" }}
                    />
                  );
                })}

                {/* Pulsing glow behind logo — responsive */}
                <motion.div
                  className="absolute w-36 h-36 sm:w-48 sm:h-48 md:w-60 md:h-60 rounded-full pointer-events-none"
                  style={{ background: "radial-gradient(circle, hsl(45 100% 50% / 0.2), transparent 70%)" }}
                  animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0.9, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Logo — responsive */}
                <motion.img
                  src="/lovable-uploads/10b5b969-cd90-4dfd-bde3-b9436600a3d6.png"
                  alt="Logo"
                  className="w-20 sm:w-28 md:w-36 h-auto object-contain z-10"
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 220, damping: 18 }}
                />

              </motion.div>

              {/* Bottom blob — responsive height */}
              <div className="relative w-full" style={{ height: "clamp(45vh, 55vh, 60vh)" }}>
                {/* The yellow blob — extends to bottom of screen */}
                <motion.div
                  className="absolute bottom-0 left-0 right-0"
                  style={{
                    background: "linear-gradient(180deg, hsl(45 100% 50%), hsl(40 90% 45%))",
                  }}
                  initial={{ height: "0%", borderRadius: "50% 50% 0 0", scale: 1 }}
                  animate={splashExiting 
                    ? { height: "200%", borderRadius: "0", scale: 1 } 
                    : { 
                        height: "100%", 
                        borderRadius: "50% 50% 0 0",
                      }
                  }
                  transition={splashExiting 
                    ? { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
                    : { duration: 1, ease: "easeOut", delay: 0.3 }
                  }
                  onAnimationComplete={() => {
                    // After rise completes, no action needed — breathing is handled by inner div
                  }}
                >
                  {/* Breathing overlay for subtle scale movement */}
                  {!splashExiting && (
                    <motion.div
                      className="absolute inset-0"
                      style={{ transformOrigin: "bottom center" }}
                      animate={{ scaleY: [1, 1.02, 1], scaleX: [1, 1.01, 1] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                  {/* Bee face container with wobble */}
                  <motion.div
                    className="absolute top-[20%] left-1/2 -translate-x-1/2 flex flex-col items-center"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ 
                      opacity: 1, 
                      scale: bigSmile ? 1.12 : 1, 
                      rotate: bigSmile ? [0, -5, 5, -3, 0] : [0, -2, 2, -1, 0],
                      y: bigSmile ? -10 : 0,
                    }}
                    transition={{
                      opacity: { delay: 1.2, duration: 0.5 },
                      scale: bigSmile 
                        ? { type: "spring", stiffness: 400, damping: 10 }
                        : { delay: 1.2, type: "spring", stiffness: 200, damping: 12 },
                      rotate: bigSmile
                        ? { duration: 0.5, ease: "easeInOut" }
                        : { delay: 2, duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" },
                      y: { type: "spring", stiffness: 300, damping: 15 },
                    }}
                  >
                    {/* Eyes — responsive size */}
                    <div className="flex items-center gap-6 sm:gap-10 md:gap-14 mb-2 sm:mb-3 md:mb-4">
                      {[0, 1].map((i) => (
                        <motion.svg
                          key={i}
                          className="w-4 h-2.5 sm:w-6 sm:h-4 md:w-8 md:h-5" viewBox="0 0 24 16"
                          animate={bigSmile 
                            ? { scaleY: 0.15, scaleX: 1.2 }
                            : { scaleY: [1, 1, 0.1, 1, 1] }
                          }
                          transition={bigSmile
                            ? { type: "spring", stiffness: 500, damping: 15 }
                            : {
                                duration: 3.5,
                                repeat: Infinity,
                                repeatDelay: 1.5,
                                times: [0, 0.4, 0.45, 0.5, 1],
                                ease: "easeInOut",
                                delay: i * 0.05,
                              }
                          }
                        >
                          <path d="M3 14 C8 2, 16 2, 21 14" stroke="hsl(30 50% 15%)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                        </motion.svg>
                      ))}
                    </div>
                    {/* Smile — responsive */}
                    <motion.svg
                      className="w-7 h-4 sm:w-10 sm:h-5 md:w-12 md:h-7" viewBox="0 0 36 20"
                      initial={{ opacity: 0, scaleX: 0.3 }}
                      animate={bigSmile 
                        ? { opacity: 1, scaleX: 1.25, scaleY: 1.35, y: 2 }
                        : { opacity: 1, scaleX: 1, scaleY: 1, y: [0, -1, 0] }
                      }
                      transition={bigSmile
                        ? { type: "spring", stiffness: 400, damping: 12 }
                        : {
                            opacity: { delay: 1.5, duration: 0.4 },
                            scaleX: { delay: 1.5, type: "spring", stiffness: 250, damping: 14 },
                            y: { delay: 2.5, duration: 2, repeat: Infinity, ease: "easeInOut" },
                          }
                      }
                    >
                      <path d="M5 6 C11 18, 25 18, 31 6" stroke="hsl(30 50% 15%)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                    </motion.svg>
                  </motion.div>

                </motion.div>


                {/* Theme toggle + CTA overlaid on blob bottom */}
                <motion.div 
                  className="absolute bottom-0 left-0 right-0 z-20 px-8 pb-8 flex flex-col items-center gap-3"
                  animate={splashExiting ? { opacity: 0, y: 30 } : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <motion.div
                    className="flex flex-col items-center gap-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                  >
                    <span className="text-xs font-semibold mb-1" style={{ color: "hsl(30 50% 15% / 0.7)" }}>Escolha seu tema:</span>
                    <div className="flex rounded-2xl p-1 gap-1" style={{ background: "hsl(30 50% 15% / 0.12)" }}>
                      <button
                        onClick={() => { if (isDark) toggleTheme(); }}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          !isDark
                            ? "shadow-sm"
                            : "opacity-70 hover:opacity-100"
                        }`}
                        style={{
                          background: !isDark ? "hsl(0 0% 100% / 0.9)" : "transparent",
                          color: "hsl(30 50% 15%)",
                        }}
                      >
                        <Sun size={16} />
                        Light
                      </button>
                      <button
                        onClick={() => { if (!isDark) toggleTheme(); }}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          isDark
                            ? "shadow-sm"
                            : "opacity-70 hover:opacity-100"
                        }`}
                        style={{
                          background: isDark ? "hsl(0 0% 100% / 0.9)" : "transparent",
                          color: "hsl(30 50% 15%)",
                        }}
                      >
                        <Moon size={16} />
                        Dark
                      </button>
                    </div>
                  </motion.div>

                  <motion.div
                    className="w-full"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.4 }}
                  >
                    <Button
                      onClick={goNext}
                      className="w-full h-14 rounded-2xl text-base font-bold"
                      style={{
                        background: "hsl(30 50% 15%)",
                        color: "hsl(45 100% 50%)",
                      }}
                    >
                      Começar 🐝
                      <ChevronRight size={18} />
                    </Button>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {step === 0 && (
            <motion.div
              key="step0"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0 px-5 flex flex-col justify-center"
              style={{ background: "linear-gradient(180deg, hsl(45 100% 50%), hsl(40 90% 45%))" }}
            >
               <motion.div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: "hsl(30 50% 15% / 0.12)" }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.2 }}
              >
                <User size={36} style={{ color: "hsl(30 50% 15%)" }} />
              </motion.div>
              <motion.h1
                className="text-2xl font-extrabold text-center mb-2"
                style={{ color: "hsl(30 50% 15%)" }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Qual é o seu nome?
              </motion.h1>
              <motion.p
                className="text-sm text-center mb-8"
                style={{ color: "hsl(30 50% 15% / 0.7)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Nos conte como podemos te chamar
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                 <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="text-center text-lg h-14 rounded-2xl border-2 bg-white/80"
                  style={{ borderColor: "hsl(30 50% 15% / 0.3)", color: "hsl(30 50% 15%)" }}
                  autoFocus
                />
              </motion.div>
              {nameCompleted && (
                <motion.div
                  className="flex items-center justify-center gap-1.5 mt-4"
                  style={{ color: "hsl(30 50% 15%)" }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Sparkles size={14} />
                  <span className="text-xs font-bold">+{POINTS_NAME} pontos!</span>
                </motion.div>
              )}
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0 px-5 flex flex-col pt-4 overflow-y-auto"
            >
              <motion.h1
                className="text-2xl font-extrabold text-foreground mb-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                O que te interessa?
              </motion.h1>
              <motion.p
                className="text-sm text-muted-foreground mb-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                Selecione seus gostos — cada um vale <span className="text-primary font-bold">+{POINTS_PER_INTEREST} pts</span>
              </motion.p>

              <div className="flex flex-wrap gap-2.5 mb-5">
                {allInterests.map((interest, i) => {
                  const selected = selectedInterests.includes(interest.id);
                  return (
                    <motion.button
                      key={interest.id}
                      custom={i}
                      variants={fadeUp}
                      initial="hidden"
                      animate="show"
                      whileTap={{ scale: 0.93 }}
                      onClick={() => toggleInterest(interest.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all border-2 ${
                        selected
                          ? "bg-primary/15 border-primary text-primary"
                          : "bg-card border-border text-foreground hover:border-primary/40"
                      }`}
                    >
                      <span>{interest.emoji}</span>
                      <span>{interest.label}</span>
                      {selected && <Check size={14} className="text-primary" />}
                    </motion.button>
                  );
                })}
              </div>

              {/* Add custom interest */}
              <motion.div
                className="flex gap-2 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Input
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  placeholder="Adicionar outro gosto..."
                  className="h-11 rounded-xl border-2 border-border bg-card text-sm"
                  onKeyDown={(e) => e.key === "Enter" && addCustomInterest()}
                />
                <Button
                  size="icon"
                  onClick={addCustomInterest}
                  disabled={!newInterest.trim()}
                  className="h-11 w-11 rounded-xl shrink-0"
                >
                  <Plus size={18} />
                </Button>
              </motion.div>

              {totalSelected > 0 && (
                <motion.div
                  className="flex items-center justify-center gap-1.5 text-primary mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Sparkles size={14} />
                  <span className="text-xs font-bold">+{interestPoints} pontos acumulados!</span>
                </motion.div>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0 px-5 flex flex-col items-center justify-center"
            >
              <motion.div
                className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  <Sparkles size={44} className="text-primary" />
                </motion.div>
              </motion.div>
              <motion.h1
                className="text-2xl font-extrabold text-foreground mb-2 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Bem-vindo, {name}! 🎉
              </motion.h1>
              <motion.p
                className="text-sm text-muted-foreground text-center mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Você já começou com
              </motion.p>
              <motion.div
                className="flex items-center gap-2 bg-primary/15 rounded-2xl px-6 py-3 mb-8"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
              >
                <Trophy size={22} className="text-primary" />
                <span className="text-2xl font-extrabold text-primary">{totalPossiblePoints}</span>
                <span className="text-sm font-bold text-primary/70">pontos</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="w-full"
              >
                <Button
                  onClick={handleFinish}
                  className="w-full h-14 rounded-2xl text-base font-bold"
                >
                  Começar a usar o BEEP
                  <ChevronRight size={18} />
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom nav buttons - only for steps 0 and 1 */}
      {step >= 0 && step < 2 && (
        <motion.div
          className="px-5 pb-8 pt-3 flex gap-3 relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {step > 0 && (
            <Button
              variant="outline"
              onClick={goBack}
              className="h-12 rounded-2xl flex-1 font-semibold border-2"
            >
              Voltar
            </Button>
          )}
          <Button
            onClick={goNext}
            disabled={step === 0 && !nameCompleted}
            className="h-12 rounded-2xl flex-1 font-semibold"
          >
            {step === 0 ? "Continuar" : "Finalizar"}
            <ChevronRight size={16} />
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default Onboarding;
