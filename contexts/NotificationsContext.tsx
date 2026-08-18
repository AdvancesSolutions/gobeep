import React, { createContext, useContext, useState, ReactNode } from 'react';

type Notification = {
  id: string;
  title: string;
  description: string;
  color?: string;
  icon?: any;
};

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, 'id'>) => void;
  markAsRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextType>({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  markAsRead: () => {},
});

export const useNotifications = () => useContext(NotificationsContext);

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const addNotification = (n: Omit<Notification, 'id'>) => {
    const newNotif = { ...n, id: Date.now().toString() };
    setNotifications(prev => [newNotif, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = () => setUnreadCount(0);

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead }}>
      {children}
    </NotificationsContext.Provider>
  );
};
