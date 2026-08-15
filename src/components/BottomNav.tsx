import { Home, Clock, User, Wallet, Flame, Radio, Mic, Camera, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface BottomNavProps {
  active: string;
  onNavigate: (page: string) => void;
}

const leftItems = [
  { id: "home", icon: Home, page: "home" },
  { id: "bets", icon: Flame, page: "bets" },
];

const rightItems = [
  { id: "wallet", icon: Wallet, page: "wallet" },
  { id: "profile", icon: User, page: "profile" },
];

const vibrate = (ms = 15) => {
  if (navigator.vibrate) navigator.vibrate(ms);
};

const BottomNav = ({ active, onNavigate }: BottomNavProps) => {
  const [fabOpen, setFabOpen] = useState(false);

  const renderItem = (item: { id: string; icon: any; page: string }) => {
    const Icon = item.icon;
    const isActive = active === item.id;
    return (
      <button
        key={item.id}
        onClick={() => { vibrate(); onNavigate(item.page); }}
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
  };

  return (
    <>
      {/* FAB expanded options */}
      <AnimatePresence>
        {fabOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFabOpen(false)}
            />
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] flex flex-col items-center gap-3">
              <motion.button
                initial={{ opacity: 0, y: 30, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 400, damping: 22, delay: 0.05 }}
                onClick={() => { vibrate(25); setFabOpen(false); onNavigate("recognition"); }}
                className="flex items-center gap-3"
              >
                <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30">
                  <Mic size={22} />
                </div>
                <span className="bg-card text-foreground text-sm font-semibold px-4 py-2 rounded-full shadow-lg border border-border/50">
                  Rádio — Áudio
                </span>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 30, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                onClick={() => { vibrate(25); setFabOpen(false); onNavigate("tv-recognition"); }}
                className="flex items-center gap-3"
              >
                <div className="w-14 h-14 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-lg shadow-accent/30">
                  <Camera size={22} />
                </div>
                <span className="bg-card text-foreground text-sm font-semibold px-4 py-2 rounded-full shadow-lg border border-border/50">
                  TV — Imagem
                </span>
              </motion.button>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Tab Bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2.5rem)] max-w-[22rem]">
        <nav className="flex items-center justify-around bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl py-2.5 px-4 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
          {leftItems.map(renderItem)}

          {/* Center FAB button */}
          <motion.button
            onClick={() => { vibrate(20); setFabOpen((prev) => !prev); }}
            className="relative -mt-8 w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[0_6px_24px_hsl(var(--primary)/0.4)] border-4 border-background"
            whileTap={{ scale: 0.9 }}
            animate={{ rotate: fabOpen ? 45 : 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            {fabOpen ? <X size={26} /> : <Radio size={26} />}
          </motion.button>

          {rightItems.map(renderItem)}
        </nav>
      </div>
    </>
  );
};

export default BottomNav;
