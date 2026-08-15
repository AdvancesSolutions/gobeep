import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  user: { name: string; avatar?: string; id?: string } | null;
}

const AuthContext = createContext<AuthContextType>({ user: { name: 'Usuário BEEP', id: '1' } });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState({ 
    name: 'Usuário BEEP', 
    id: '1',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=BeepUser'
  });
  
  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
};
