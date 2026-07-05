import React, { ReactNode } from 'react';

interface AdminLayoutProps {
  children?: ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  // Simulación de navegación interna de gestión
  const menuItems = [
    { label: 'PANEL DE CONTROL', desc: 'Resumen de operaciones' },
    { label: 'GESTIÓN DE STOCK', desc: 'Control de armería' },
    { label: 'AGENTS / ASESORES', desc: 'Asignación de equipos' },
    { label: 'REPORTES', desc: 'Métricas de rendimiento' },
  ];

  return (
    <div className="flex h-screen bg-[#0f1923] text-gray-200 overflow-hidden font-sans select-none">
      {/* Sidebar de Comando Central */}
      <aside className="w-64 bg-[#1f2326] border-r-2 border-[#ff4655]/40 flex flex-col justify-between">
        <div>
          {/* Header del Sidebar */}
          <div className="p-6 border-b border-gray-800 bg-[#16191b]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#ff4655] animate-pulse"></div>
              <span className="text-[#ff4655] font-mono font-bold tracking-[0.2em] text-sm">HQ//ADMIN</span>
            </div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Panel de Control General</p>
          </div>

          {/* Opciones de Gestión */}
          <nav className="p-4 space-y-2">
            {menuItems.map((item, index) => (
              <button
                key={index}
                className="w-full text-left flex flex-col p-3 transition-all duration-150 border-l-2 border-transparent hover:border-[#00ece0] hover:bg-gray-800/40 group"
              >
                <span className="text-xs font-mono tracking-wider font-bold group-hover:text-white transition-colors">
                  {item.label}
                </span>
                <span className="text-[10px] text-gray-400 group-hover:text-[#00ece0]/80 transition-colors">
                  {item.desc}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Estatus del Sistema en el Footer */}
        <div className="p-4 bg-[#16191b] border-t border-gray-800 font-mono text-[10px] text-gray-500 flex flex-col gap-1">
          <div>RANGO: <span className="text-white">ADMINISTRADOR</span></div>
          <div>ESTADO: <span className="text-[#00ece0]">CONECTADO</span></div>
        </div>
      </aside>

      {/* Área de Contenido Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar Superior de Gestión */}
        <header className="h-16 bg-[#1f2326]/60 border-b border-gray-800 flex items-center justify-between px-8 backdrop-blur-md">
          <div className="text-xs font-mono tracking-widest text-gray-400 uppercase">
            Área de Gestión // <span className="text-[#ff4655]">Operaciones</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-[#00ece0]"></div>
            <span className="text-xs font-mono text-gray-300">Servidor Activo</span>
          </div>
        </header>

        {/* Vista Inyectada */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#0f1923]">
          <div className="border border-gray-800 p-6 bg-[#1f2326]/20 relative overflow-hidden">
            {/* Esquina decorativa estilo Valorant */}
            <div className="absolute top-0 right-0 w-2 h-2 bg-[#ff4655]"></div>
            {children || <p className="text-gray-400 font-mono text-sm">// Selecciona un módulo del panel de control para desplegar la interfaz.</p>}
          </div>
        </main>
      </div>
    </div>
  );
};