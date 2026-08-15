import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { Trophy, Zap, Gift, Radio, Tv, Star, Bell } from "lucide-react";

export type AppNotification = {
  id: string;
  icon: typeof Bell;
  title: string;
  description: string;
  time: string;
  read: boolean;
  color: string;
};

interface NotificationsContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: Omit<AppNotification, "id" | "time" | "read">) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
}

const NotificationsContext = createContext<NotificationsContextType>({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  markAllRead: () => {},
  dismiss: () => {},
});

export const useNotifications = () => useContext(NotificationsContext);

const initialNotifications: AppNotification[] = [
  { id: "1", icon: Zap, title: "Sessão ao vivo detectada!", description: "Cidade FM está tocando agora. Abra para ganhar pontos!", time: "Agora", read: false, color: "text-primary" },
  { id: "2", icon: Trophy, title: "+45 pontos ganhos", description: "Você completou 3 sessões hoje. Continue assim!", time: "12 min", read: false, color: "text-primary" },
  { id: "3", icon: Tv, title: "Novo programa disponível", description: "Jornal da Cidade começou na SIC Notícias", time: "28 min", read: false, color: "text-accent-foreground" },
  { id: "4", icon: Gift, title: "Recompensa desbloqueada", description: "Você atingiu 500 pontos! Resgate no Wallet.", time: "1h", read: true, color: "text-primary" },
  { id: "5", icon: Radio, title: "Rádio favorita no ar", description: "RFM está transmitindo Top Hits Night agora.", time: "2h", read: true, color: "text-primary" },
  { id: "6", icon: Star, title: "Enquete encerrada", description: "Veja o resultado da votação que você participou.", time: "3h", read: true, color: "text-destructive" },
];

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback((n: Omit<AppNotification, "id" | "time" | "read">) => {
    const newNotif: AppNotification = {
      ...n,
      id: Date.now().toString(),
      time: "Agora",
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, addNotification, markAllRead, dismiss }}>
      {children}
    </NotificationsContext.Provider>
  );
};
