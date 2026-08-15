import { useEffect, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { Trophy } from "lucide-react";
import { usePoints } from "@/contexts/PointsContext";

interface AnimatedPointsProps {
  size?: "sm" | "md";
}

const AnimatedPoints = ({ size = "sm" }: AnimatedPointsProps) => {
  const { totalPoints } = usePoints();
  const controls = useAnimation();
  const prevPoints = useRef(totalPoints);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (totalPoints !== prevPoints.current) {
      prevPoints.current = totalPoints;
      setFlash(true);
      controls.start({
        scale: [1, 1.35, 1],
        transition: { duration: 0.4, ease: "easeOut" },
      });
      setTimeout(() => setFlash(false), 500);
    }
  }, [totalPoints, controls]);

  const isMd = size === "md";

  return (
    <motion.div
      animate={controls}
      className={`flex items-center gap-1 rounded-full ${
        isMd
          ? "bg-primary/20 px-2.5 py-1.5"
          : "bg-primary/15 px-2.5 py-1"
      } ${flash ? "ring-2 ring-primary/40" : ""} transition-shadow`}
    >
      <Trophy size={isMd ? 14 : 12} className="text-primary" />
      <span className={`font-bold text-primary tabular-nums ${isMd ? "text-sm" : "text-xs"}`}>
        {totalPoints}
      </span>
      {isMd && <span className="text-[9px] font-semibold text-primary/60">pts</span>}
    </motion.div>
  );
};

export default AnimatedPoints;
