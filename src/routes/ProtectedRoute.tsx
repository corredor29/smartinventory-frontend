import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Spinner estilizado con la temática del juego mientras se valida el estado
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f1923] flex flex-col items-center justify-center font-mono">
        <div className="w-12 h-12 border-4 border-t-[#ff4655] border-r-transparent border-b-[#00ece0] border-l-transparent rounded-full animate-spin mb-4"></div>
        <span className="text-[#00ece0] tracking-[0.2em] text-sm uppercase animate-pulse">
          Cargando Interfaz Táctica...
        </span>
      </div>
    );
  }

  // Redirección si el usuario no ha iniciado sesión
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Validación de privilegios/roles específicos para módulos críticos ( Armería/Inventario)
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Renderiza los componentes hijos si pasa todas las directivas de seguridad
  return <Outlet />;
};