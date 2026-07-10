import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// Roles permitidos dentro del sistema táctico
export type UserRole = 'admin' | 'asesor' | 'operator' | 'client';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  agentName?: string;  // Toque creativo: Nombre clave de agente asignado
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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Inicializar sesión desde el almacenamiento local persistente al cargar la app
    const storedToken = localStorage.getItem('smart_inventory_token');
    const storedUser = localStorage.getItem('smart_inventory_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error al restaurar la sesión táctica:", error);
        // Limpieza preventiva si los datos están corruptos
        localStorage.removeItem('smart_inventory_token');
        localStorage.removeItem('smart_inventory_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: UserProfile) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('smart_inventory_token', newToken);
    localStorage.setItem('smart_inventory_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('smart_inventory_token');
    localStorage.removeItem('smart_inventory_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para un consumo seguro del estado global
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider operativo');
  }
  return context;
};