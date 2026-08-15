import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { useNotifications } from "./NotificationsContext";
import { Trophy, Zap, Gift } from "lucide-react";

interface PointsContextType {
  totalPoints: number;
  addPoints: (amount: number, reason?: string) => void;
  removePoints: (amount: number) => void;
}

const PointsContext = createContext<PointsContextType>({ totalPoints: 0, addPoints: () => {}, removePoints: () => {} });

export const usePoints = () => useContext(PointsContext);

const pointMessages = [
  "Reconhecimento bem-sucedido! Continue assim!",
  "Você está arrasando! Mais pontos no bolso.",
  "Boa! Seus pontos estão crescendo.",
  "Sessão detectada com sucesso!",
];

export const PointsProvider = ({ children }: { children: ReactNode }) => {
  const [totalPoints, setTotalPoints] = useState(120);
  const { addNotification } = useNotifications();

  const addPoints = useCallback((amount: number, reason?: string) => {
    setTotalPoints((prev) => {
      const newTotal = prev + amount;
      // milestone notifications
      if (prev < 500 && newTotal >= 500) {
        addNotification({ icon: Gift, title: "Recompensa desbloqueada!", description: "Você atingiu 500 pontos! Resgate no Wallet.", color: "text-primary" });
      }
      if (prev < 1000 && newTotal >= 1000) {
        addNotification({ icon: Trophy, title: "Marco de 1.000 pontos!", description: "Parabéns! Você é um mestre do reconhecimento.", color: "text-primary" });
      }
      return newTotal;
    });
    // always notify on points earned
    const msg = reason || pointMessages[Math.floor(Math.random() * pointMessages.length)];
    addNotification({ icon: Zap, title: `+${amount} pontos ganhos`, description: msg, color: "text-primary" });
  }, [addNotification]);

  const removePoints = useCallback((amount: number) => {
    setTotalPoints((prev) => Math.max(0, prev - amount));
  }, []);

  return (
    <PointsContext.Provider value={{ totalPoints, addPoints, removePoints }}>
      {children}
    </PointsContext.Provider>
  );
};
