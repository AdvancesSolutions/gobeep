import { motion, AnimatePresence } from "framer-motion";
import { Star, Trophy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PointsCelebrationProps {
  open: boolean;
  points: number;
  title: string;
  description: string;
  onContinue: () => void;
}

const STARS = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  size: 12 + Math.random() * 20,
  x: -140 + Math.random() * 280,
  y: -160 + Math.random() * 320,
  delay: Math.random() * 0.6,
  rotate: Math.random() * 360,
  color: i % 3 === 0 ? "text-primary" : i % 3 === 1 ? "text-blue-300" : "text-yellow-300",
}));

const PointsCelebration = ({ open, points, title, description, onContinue }: PointsCelebrationProps) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Stars burst */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {STARS.map((star) => (
              <motion.div
                key={star.id}
                className={`absolute ${star.color}`}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0, rotate: 0 }}
                animate={{
                  opacity: [0, 1, 1, 0.6],
                  scale: [0, 1.2, 1, 0.8],
                  x: star.x,
                  y: star.y,
                  rotate: star.rotate,
                }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{
                  duration: 1,
                  delay: 0.2 + star.delay,
                  ease: "easeOut",
                }}
              >
                <Star size={star.size} fill="currentColor" />
              </motion.div>
            ))}
          </div>

          {/* Card */}
          <motion.div
            className="relative z-10 w-72 mx-auto flex flex-col items-center"
            initial={{ scale: 0.6, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.1 }}
          >
            <div className="w-full rounded-3xl bg-gradient-to-b from-card to-secondary border border-border shadow-2xl p-8 flex flex-col items-center">
              {/* Emoji / Icon */}
              <motion.div
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/30 flex items-center justify-center mb-5"
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.3 }}
              >
                <span className="text-5xl">🥳</span>
              </motion.div>

              {/* Title */}
              <motion.h2
                className="text-lg font-bold text-foreground text-center mb-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
              >
                {title}
              </motion.h2>

              {/* Description */}
              <motion.p
                className="text-sm text-muted-foreground text-center mb-5 leading-relaxed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
              >
                {description}
              </motion.p>

              {/* Points badge */}
              <motion.div
                className="flex items-center gap-2 bg-primary/15 rounded-full px-5 py-2.5 mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.6 }}
              >
                <Trophy size={18} className="text-primary" />
                <span className="text-xl font-black text-primary tabular-nums">+{points}</span>
                <span className="text-xs font-semibold text-primary/70">pts</span>
              </motion.div>

              {/* Continue button */}
              <motion.div
                className="w-full"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75 }}
              >
                <Button
                  onClick={onContinue}
                  className="w-full h-12 rounded-xl font-bold text-base"
                >
                  <Sparkles size={16} className="mr-1" />
                  Continuar
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PointsCelebration;
