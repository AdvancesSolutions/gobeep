import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationsContext";

const NotificationsPanel = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { notifications, unreadCount, markAllRead, dismiss } = useNotifications();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-0 right-0 w-full max-w-sm h-full bg-background z-50 shadow-2xl flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="px-5 pt-12 pb-4 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Bell size={20} className="text-foreground" />
                <h2 className="text-lg font-black text-foreground">Notificações</h2>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[11px] font-semibold text-primary">
                    Marcar tudo lido
                  </button>
                )}
                <button onClick={onClose} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
                  <X size={16} className="text-muted-foreground" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {notifications.map((n, i) => {
                const Icon = n.icon;
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 26 }}
                    className={`relative flex items-start gap-3 p-3.5 rounded-2xl border transition-all ${
                      n.read ? "bg-card border-border" : "bg-primary/5 border-primary/20"
                    }`}
                  >
                    {!n.read && (
                      <div className="absolute top-3.5 right-3 w-2 h-2 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.5)]" />
                    )}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${n.read ? "bg-muted" : "bg-primary/15"}`}>
                      <Icon size={16} className={n.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold leading-tight ${n.read ? "text-foreground/70" : "text-foreground"}`}>
                        {n.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{n.description}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1.5 font-medium">{n.time}</p>
                    </div>
                    <button
                      onClick={() => dismiss(n.id)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-muted transition-colors shrink-0 mt-0.5"
                    >
                      <X size={12} />
                    </button>
                  </motion.div>
                );
              })}

              {notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Bell size={32} className="text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-semibold text-muted-foreground">Nenhuma notificação</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Você está em dia!</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationsPanel;
