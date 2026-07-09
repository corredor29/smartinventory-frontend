import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Error404 = () => {
  const navigate = useNavigate();

  const handleReturn = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0f1923] flex flex-col relative overflow-hidden font-mono">
      {/* Animación de fondo - Estelas rojas */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 bg-[#ff4655] opacity-30"
            style={{
              height: `${Math.random() * 200 + 50}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: `rotate(${Math.random() * 360}deg)`,
              animation: `float ${Math.random() * 10 + 5}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Barra Superior */}
      <header className="relative z-10 h-16 bg-[#0f1923] border-b-2 border-[#00ece0] flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <div className="text-[#00ece0] font-bold text-xl tracking-[0.2em] uppercase">
            SmartInventory
          </div>
          <div className="text-gray-500 text-xs tracking-widest uppercase">
            System Status: <span className="text-[#ff4655]">Offline</span>
          </div>
        </div>
        <div className="text-gray-500 text-xs tracking-widest uppercase">
          Admin Guard: <span className="text-[#00ece0]">Active</span>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-8">
        <div className="text-center max-w-2xl">
          {/* Título Principal */}
          <h1 className="text-white text-2xl font-bold uppercase tracking-[0.3em] mb-4">
            Dislocación de Protocolo
          </h1>

          {/* Número 404 con glitch */}
          <div className="relative mb-4">
            <h2 className="text-[#ff4655] text-[180px] font-bold leading-none tracking-tighter animate-glitch">
              404
            </h2>
          </div>

          {/* Subtítulo */}
          <h3 className="text-[#ff4655] text-xl font-bold uppercase tracking-[0.2em] mb-6">
            Error 404: Sector No Detectado
          </h3>

          {/* Párrafo Descriptor */}
          <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-lg mx-auto font-mono">
            El sistema ha perdido la señal del sector solicitado. Las coordenadas proporcionadas
            no corresponden a ninguna ubicación conocida en la red táctica. Verifique la
            integridad de la ruta y reintente la conexión.
          </p>

          {/* Botón de Acción */}
          <button
            onClick={handleReturn}
            className="group relative px-8 py-4 bg-transparent border-2 border-[#00ece0] text-[#00ece0] text-sm font-bold uppercase tracking-[0.2em] transition-all duration-300 hover:bg-[#00ece0]/10 hover:shadow-[0_0_20px_rgba(0,236,224,0.3)]"
          >
            <span className="flex items-center gap-3">
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              Reintegrarse al Equipo
            </span>
          </button>
        </div>
      </main>

      {/* Estilos CSS para animaciones */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
            opacity: 0.3;
          }
          25% {
            transform: translateY(-100px) rotate(45deg);
            opacity: 0.5;
          }
          50% {
            transform: translateY(-50px) rotate(-45deg);
            opacity: 0.2;
          }
          75% {
            transform: translateY(-150px) rotate(90deg);
            opacity: 0.4;
          }
        }

        @keyframes glitch {
          0%, 100% {
            text-shadow: 2px 0 #ff0000, -2px 0 #00ffff;
            transform: translate(0);
          }
          20% {
            text-shadow: -2px 0 #ff0000, 2px 0 #00ffff;
            transform: translate(-2px, 2px);
          }
          40% {
            text-shadow: 2px 0 #ff0000, -2px 0 #00ffff;
            transform: translate(2px, -2px);
          }
          60% {
            text-shadow: -2px 0 #ff0000, 2px 0 #00ffff;
            transform: translate(-2px, -2px);
          }
          80% {
            text-shadow: 2px 0 #ff0000, -2px 0 #00ffff;
            transform: translate(2px, 2px);
          }
        }

        .animate-glitch {
          animation: glitch 0.3s infinite;
        }
      `}</style>
    </div>
  );
};

export default Error404;
