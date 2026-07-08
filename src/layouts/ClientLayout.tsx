import React, { type ReactNode } from 'react';

interface ClientLayoutProps {
  children?: ReactNode;
}

export const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#0f1923] text-gray-200 flex flex-col font-sans selection:bg-[#ff4655] selection:text-white">
      {/* Navbar Minimalista Superior */}
      <header className="h-16 bg-[#1f2326] border-b border-gray-800 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Logo Estilizado del Sistema */}
          <div className="w-6 h-6 bg-[#ff4655] transform rotate-45 flex items-center justify-center">
            <div className="w-2 h-2 bg-[#0f1923] transform -rotate-45"></div>
          </div>
          <span className="font-mono text-sm tracking-[0.2em] font-bold text-white">SMART//SUPPORT</span>
        </div>
        
        <div className="flex items-center gap-2 text-[11px] font-mono text-gray-400 bg-gray-800/40 px-3 py-1 border border-gray-700/60">
          SOPORTE AL CLIENTE // <span className="text-[#00ece0] animate-pulse">EN LÍNEA</span>
        </div>
      </header>

      {/* Contenedor Central del Chat */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-radial-gradient">
        <div className="w-full max-w-4xl h-[calc(100vh-8rem)] bg-[#1f2326] border border-gray-800 shadow-2xl flex flex-col relative">
          {/* Guía visual sutil superior */}
          <div className="w-full h-1 bg-gradient-to-r from-[#ff4655] via-[#00ece0] to-transparent"></div>
          
          {/* Contenido del Chat o Vista del Cliente */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {children || (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <span className="text-4xl mb-4">💬</span>
                <h3 className="font-mono text-sm tracking-widest text-white uppercase mb-1">Centro de Soporte Táctico</h3>
                <p className="text-xs text-gray-400 max-w-xs font-mono">El chat está listo. Conectando con un asesor de la armería...</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};