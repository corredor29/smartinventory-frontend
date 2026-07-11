import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getCustomerIdFromToken, isTokenExpired } from '../utils/jwt';
import { CHAT_SESSION_KEY, clearStoredMessages } from '../utils/chatHistory';

// Roles permitidos dentro del sistema táctico
// Convención canónica: 'admin' | 'asesor' | 'Client'
// Se mantienen 'Admin' | 'Operator' por compatibilidad con sesiones antiguas en localStorage
export type UserRole = 'admin' | 'asesor' | 'Admin' | 'Operator' | 'Client';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  agentName?: string;
  userId?: number;
  customerId?: number | null;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function clearClientChatStorage() {
  localStorage.removeItem(CHAT_SESSION_KEY);
  clearStoredMessages();
}

function clearAuthStorage() {
  localStorage.removeItem('smart_inventory_token');
  localStorage.removeItem('smart_inventory_user');
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('smart_inventory_token');
    const storedUser = localStorage.getItem('smart_inventory_user');

    if (storedToken && storedUser) {
      try {
        if (isTokenExpired(storedToken)) {
          clearAuthStorage();
        } else {
          const parsed = JSON.parse(storedUser) as UserProfile;
          const fromJwt = getCustomerIdFromToken(storedToken);
          const customerId = parsed.customerId ?? fromJwt ?? null;

          // Cliente sin customerId: sesión vieja inválida para escalación → forzar re-login
          if (parsed.role === 'Client' && !customerId) {
            clearAuthStorage();
          } else {
            const hydrated: UserProfile = { ...parsed, customerId };
            setToken(storedToken);
            setUser(hydrated);
            localStorage.setItem('smart_inventory_user', JSON.stringify(hydrated));
          }
        }
      } catch (error) {
        console.error('Error al restaurar la sesión táctica:', error);
        clearAuthStorage();
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: UserProfile) => {
    const fromJwt = getCustomerIdFromToken(newToken);
    const hydrated: UserProfile = {
      ...newUser,
      customerId: newUser.customerId ?? fromJwt ?? null,
    };
    // Conservar sesión de chat: al loguearse se vincula el Customer a la misma
    // conversación (historial bot+cliente intacto para el asesor).
    setToken(newToken);
    setUser(hydrated);
    localStorage.setItem('smart_inventory_token', newToken);
    localStorage.setItem('smart_inventory_user', JSON.stringify(hydrated));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    clearAuthStorage();
    // Evita que el historial del chat quede visible para el siguiente visitante/cuenta
    clearClientChatStorage();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !isTokenExpired(token),
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider operativo');
  }
  return context;
};
