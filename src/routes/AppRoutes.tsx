import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '../pages/LoginPage';

const Dashboard = () => <div className="text-white p-6 bg-[#1f2326] border-l-4 border-[#ff4655]">Panel General // THE RANGE</div>;
const Armeria = () => <div className="text-white p-6 bg-[#1f2326] border-l-4 border-[#00ece0]">Módulo de Armas // CATÁLOGO DE PRODUCTOS</div>;
const Almacenamiento = () => <div className="text-white p-6 bg-[#1f2326] border border-[#ff4655]/30">Sitio de Almacenamiento // INVENTARIO</div>;
const HistorialPartidas = () => <div className="text-white p-6 bg-[#1f2326]">Historial de Partidas // REGISTRO DE VENTAS</div>;
const Economia = () => <div className="text-white p-6 bg-[#1f2326] font-mono">Economía / Créditos // FACTURACIÓN</div>;
const KilljoyBot = () => <div className="text-white p-6 bg-[#1f2326] border border-[#00ece0]/30">Asistente Táctico // KILLJOY BOT</div>;
const Unauthorized = () => <div className="text-[#ff4655] font-mono p-10 text-center tracking-wider uppercase">Acceso Denegado // Permisos Insuficientes</div>;

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navItems = [
    { path: '/dashboard', label: 'The Range', desc: 'Dashboard' },
    { path: '/armeria', label: 'Armería', desc: 'Catálogo' },
    { path: '/almacenamiento', label: 'Almacenamiento', desc: 'Inventario', roles: ['Admin'] as const },
    { path: '/ventas', label: 'Historial Partidas', desc: 'Ventas' },
    { path: '/economia', label: 'Economía', desc: 'Facturas' },
    { path: '/killjoy-bot', label: 'Asistente Táctico', desc: 'Killjoy Bot' },
  ];

  return (
    <div className="flex h-screen bg-[#0f1923] text-gray-200 overflow-hidden select-none">
      <aside className="w-64 bg-[#1f2326] border-r border-[#ff4655]/20 flex flex-col justify-between">
        <div>
          <div className="p-6 border-b border-gray-800 flex flex-col">
            <span className="text-[#ff4655] font-bold text-xl tracking-[0.2em] font-mono">SMART//INV</span>
            <span className="text-[10px] text-gray-500 tracking-widest uppercase mt-1">Suministro de Hardware</span>
          </div>
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              if (item.roles && user && !item.roles.includes(user.role as any)) return null;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `group flex flex-col p-3 transition-all duration-150 border-r-4 relative ${
                      isActive ? 'bg-[#ff4655]/10 border-[#ff4655] text-white' : 'border-transparent hover:bg-gray-800/50 hover:text-white'
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

        <div className="p-4 border-t border-gray-800 bg-[#16191b] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-[#00ece0] font-mono font-bold">{user?.agentName || user?.username || 'AGENTE'}</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">{user?.role}</span>
            </div>
            <button onClick={logout} className="px-2 py-1 bg-transparent hover:bg-[#ff4655]/20 border border-[#ff4655] text-[#ff4655] text-[10px] font-mono uppercase tracking-wider transition-all">Salir</button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 border-b border-gray-800 flex items-center justify-between px-8 bg-[#1f2326]/40 backdrop-blur-md">
          <div className="text-xs font-mono tracking-[0.3em] uppercase text-gray-400">Fase de Compra // <span className="text-[#00ece0]">Sistemas En Línea</span></div>
          <div className="text-xs font-mono bg-gray-800 px-3 py-1 text-gray-400 border border-gray-700">REG_SERVER: <span className="text-white">LATAM_BUCARAMANGA</span></div>
        </header>

        <div className="p-8 flex-1">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/armeria" element={<Armeria />} />
            <Route path="/ventas" element={<HistorialPartidas />} />
            <Route path="/economia" element={<Economia />} />
            <Route path="/killjoy-bot" element={<KilljoyBot />} />
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

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/*" element={<MainLayout />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};