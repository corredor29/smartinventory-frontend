import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { AdminLoginPage } from '../pages/AdminLoginPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { ProductsPage } from '../pages/products/ProductsPage';
import { InvoicesPage } from '../pages/invoices/InvoicesPage';
import { CartPage } from '../pages/CartPage';
import { OrdersPage } from '../pages/OrdersPage';
import { LogOut } from 'lucide-react';
const Armeria = () => <div className="text-white p-6 bg-[#1f2326] border-l-4 border-[#00ece0]">Módulo de Armas // CATÁLOGO DE PRODUCTOS</div>;
const Almacenamiento = () => <div className="text-white p-6 bg-[#1f2326] border border-[#ff4655]/30">Sitio de Almacenamiento // INVENTARIO</div>;
const HistorialPartidas = () => <div className="text-white p-6 bg-[#1f2326]">Historial de Partidas // REGISTRO DE VENTAS</div>;
const Economia = () => <div className="text-white p-6 bg-[#1f2326] font-mono">Economía / Créditos // FACTURACIÓN</div>;
const KilljoyBot = () => <div className="text-white p-6 bg-[#1f2326] border border-[#00ece0]/30">Asistente Táctico // KILLJOY BOT</div>;
const Unauthorized = () => <div className="text-[#ff4655] font-mono p-10 text-center tracking-wider uppercase">Acceso Denegado // Permisos Insuficientes</div>;

// Layout Principal con Estética Militarizada de Valorant
const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { path: '/dashboard', label: 'The Range', desc: 'Dashboard', roles: ['admin', 'administrador', 'Admin', 'Operator'] as UserRole[] },
    { path: '/armeria', label: 'Armería', desc: 'Catálogo', roles: ['admin', 'administrador', 'Admin', 'Operator'] as UserRole[] },
    { path: '/almacenamiento', label: 'Almacenamiento', desc: 'Inventario', roles: ['admin', 'Admin'] as UserRole[] },
    { path: '/ventas', label: 'Historial Partidas', desc: 'Ventas', roles: ['admin', 'administrador', 'Admin', 'Operator'] as UserRole[] },
    { path: '/economia', label: 'Economía', desc: 'Facturas', roles: ['admin', 'administrador', 'Admin', 'Operator'] as UserRole[] },
    { path: '/killjoy-bot', label: 'Asistente Táctico', desc: 'Killjoy Bot', roles: ['admin', 'administrador', 'Admin', 'Operator'] as UserRole[] },
  ];

  return (
    <div className="flex h-screen bg-[#0f1923] text-gray-200 overflow-hidden select-none">
      {/* Sidebar Táctico */}
      <aside className="w-64 bg-[#1f2326] border-r border-[#ff4655]/20 flex flex-col justify-between">
        <div>
          {/* Header del Sidebar */}
          <div className="p-6 border-b border-gray-800 flex flex-col">
            <span className="text-[#ff4655] font-bold text-xl tracking-[0.2em] font-mono">SMART//INV</span>
            <span className="text-[10px] text-gray-500 tracking-widest uppercase mt-1">Suministro de Hardware</span>
          </div>

          {/* Menú de Compra / Navegación */}
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              if (item.roles && user && !item.roles.includes(user.role)) return null;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `group flex flex-col p-3 transition-all duration-150 border-r-4 relative ${
                      isActive
                        ? 'bg-[#ff4655]/10 border-[#ff4655] text-white'
                        : 'border-transparent hover:bg-gray-800/50 hover:text-white'
                    }`
                  }
                >
                  <span className="text-xs font-mono tracking-widest font-bold uppercase">{item.label}</span>
                  <span className="text-[10px] text-gray-400 group-hover:text-[#00ece0] transition-colors">{item.desc}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Perfil del Agente & Footer */}
        <div className="p-4 border-t border-gray-800 bg-[#16191b] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-[#00ece0] font-mono font-bold">
                {user?.agentName || user?.username || 'AGENTE'}
              </span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">{user?.role}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 text-[10px] font-mono uppercase tracking-wider transition-all rounded"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Contenedor Principal de la Interfaz de Operaciones */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Barra Superior */}
        <header className="h-16 border-b border-gray-800 flex items-center justify-between px-8 bg-[#1f2326]/40 backdrop-blur-md">
          <div className="text-xs font-mono tracking-[0.3em] uppercase text-gray-400">
            Fase de Compra // <span className="text-[#00ece0]">Sistemas En Línea</span>
          </div>
          <div className="text-xs font-mono bg-gray-800 px-3 py-1 text-gray-400 border border-gray-700">
            REG_SERVER: <span className="text-white">LATAM_BUCARAMANGA</span>
          </div>
        </header>

        {/* Contenido Dinámico de las Vistas */}
        <div className="p-8 flex-1">
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/armeria" element={<Armeria />} />
            <Route path="/ventas" element={<HistorialPartidas />} />
            <Route path="/economia" element={<Economia />} />
            <Route path="/killjoy-bot" element={<KilljoyBot />} />
            
            {/* Ruta Protegida con restricción de Rol para Inventario */}
            <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
              <Route path="/almacenamiento" element={<Almacenamiento />} />
            </Route>

            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

// Enrutador Raíz del Sistema Global
export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta Pública de Inicio (catálogo, sin necesidad de sesión) */}
        <Route path="/" element={<HomePage />} />

        {/* Ruta Pública de Autenticación (login / registro) */}
        <Route path="/login" element={<LoginPage />} />

        {/* Ruta de Acceso Administrativo Oculto */}
        <Route path="/admin-login" element={<AdminLoginPage />} />

        {/* Rutas protegidas del cliente (carrito, pedidos, facturas) */}
        <Route element={<ProtectedRoute allowedRoles={['Client']} />}>
          <Route path="/carrito" element={<CartPage />} />
          <Route path="/pedidos" element={<OrdersPage />} />
          <Route path="/facturas" element={<InvoicesPage />} />
        </Route>

        {/* Grupo de Rutas Protegidas de Operación (admin, asesor, Admin, Operator) */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'asesor', 'Admin', 'Operator']} />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/armeria" element={<MainLayout />} />
          <Route path="/almacenamiento" element={<MainLayout />} />
          <Route path="/ventas" element={<MainLayout />} />
          <Route path="/economia" element={<MainLayout />} />
          <Route path="/killjoy-bot" element={<MainLayout />} />
          <Route path="/unauthorized" element={<MainLayout />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};