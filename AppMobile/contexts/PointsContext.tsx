import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useNotifications } from './NotificationsContext';
import { Music, Gift, ArrowUpRight, Zap, TrendingUp, Send } from 'lucide-react-native';
import { io } from 'socket.io-client';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';

const hostIp = Constants.expoConfig?.hostUri?.split(':')[0] || '10.0.2.2';
const socket = io(`http://${hostIp}:3001`);

export type Transaction = {
  id: number;
  type: "earned" | "spent";
  label: string;
  description: string;
  amount: number;
  date: string;
  icon: any;
};

const initialTransactions: Transaction[] = [
  { id: 1, type: "earned", label: "Reconhecimento", description: "Cidade FM — Música identificada", amount: 15, date: "Hoje, 14:32", icon: Music },
  { id: 2, type: "earned", label: "Bónus diário", description: "Login consecutivo — 3 dias", amount: 10, date: "Hoje, 09:00", icon: Gift },
  { id: 3, type: "spent", label: "Resgate", description: "Desconto exclusivo — Parceiro", amount: -50, date: "Ontem, 18:45", icon: ArrowUpRight },
  { id: 4, type: "earned", label: "Reconhecimento", description: "RFM — Programa ao vivo", amount: 20, date: "Ontem, 11:20", icon: Zap },
  { id: 5, type: "earned", label: "Reconhecimento", description: "SIC TV — Anúncio identificado", amount: 12, date: "2 dias atrás", icon: Music },
  { id: 6, type: "spent", label: "Resgate", description: "Voucher — Loja parceira", amount: -30, date: "3 dias atrás", icon: ArrowUpRight },
  { id: 7, type: "earned", label: "Conquista", description: "10 reconhecimentos seguidos", amount: 25, date: "4 dias atrás", icon: TrendingUp },
  { id: 8, type: "earned", label: "Reconhecimento", description: "Rádio Comercial — Jingle", amount: 8, date: "5 dias atrás", icon: Music },
];

interface PointsContextType {
  totalPoints: number;
  transactions: Transaction[];
  addPoints: (amount: number, reason?: string) => void;
  removePoints: (amount: number, reason?: string) => void;
  myBeepixKey: string | null;
  generateBeepixKey: () => string;
  sendBeepix: (toKey: string, amount: number, fromUser: string) => boolean;
}

const PointsContext = createContext<PointsContextType>({ 
  totalPoints: 0, 
  transactions: [],
  addPoints: () => {}, 
  removePoints: () => {},
  myBeepixKey: null,
  generateBeepixKey: () => "",
  sendBeepix: () => false
});

export const usePoints = () => useContext(PointsContext);

export const PointsProvider = ({ children }: { children: ReactNode }) => {
  const [totalPoints, setTotalPoints] = useState(120);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [myBeepixKey, setMyBeepixKey] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  const addPoints = useCallback((amount: number, reason?: string) => {
    setTotalPoints(prev => prev + amount);
    setTransactions(prev => [{
      id: Date.now(),
      type: "earned",
      label: "Ganho",
      description: reason || 'Pontos recebidos',
      amount: amount,
      date: "Agora mesmo",
      icon: Music
    }, ...prev]);
    addNotification({ title: `+${amount} pontos ganhos`, description: reason || 'Você ganhou pontos!', color: 'text-primary' });
  }, [addNotification]);

  const removePoints = useCallback((amount: number, reason?: string) => {
    setTotalPoints(prev => Math.max(0, prev - amount));
    setTransactions(prev => [{
      id: Date.now(),
      type: "spent",
      label: "Transferência",
      description: reason || 'Gasto de pontos',
      amount: -amount,
      date: "Agora mesmo",
      icon: Send
    }, ...prev]);
  }, []);

  const generateBeepixKey = useCallback(() => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const segments = Array.from({ length: 4 }, () =>
      Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
    );
    const newKey = `BPX-${segments.join("-")}`;
    setMyBeepixKey(newKey);
    return newKey;
  }, []);

  const sendBeepix = useCallback((toKey: string, amount: number, fromUser: string) => {
    if (amount <= 0 || amount > totalPoints) return false;
    
    // Deduct locally
    removePoints(amount, `Enviado Beepix para ${toKey}`);
    
    // Emit to network
    socket.emit('transfer_beepix', { toKey, amount, fromUser });
    return true;
  }, [totalPoints, removePoints]);

  // Listen to incoming Beepix transfers
  useEffect(() => {
    const handleReceiveBeepix = (data: any) => {
      // Check if I am the target
      if (myBeepixKey && data.toKey === myBeepixKey) {
        addPoints(data.amount, `Beepix recebido de ${data.fromUser}`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    };

    socket.on('receive_beepix', handleReceiveBeepix);
    return () => {
      socket.off('receive_beepix', handleReceiveBeepix);
    };
  }, [myBeepixKey, addPoints]);

  return (
    <PointsContext.Provider value={{ totalPoints, transactions, addPoints, removePoints, myBeepixKey, generateBeepixKey, sendBeepix }}>
      {children}
    </PointsContext.Provider>
  );
};
