import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleReturn = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    const role = user.role?.toLowerCase();
    if (role === 'admin' || role === 'asesor' || role === 'operator') {
      navigate('/dashboard');
      return;
    }
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0f1923] flex flex-col relative overflow-hidden font-mono">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(16)].map((_, i) => (
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

      <header className="relative z-10 h-16 bg-[#0f1923] border-b-2 border-[#00ece0] flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <div className="text-[#00ece0] font-bold text-xl tracking-[0.2em] uppercase">
            SmartInventory
          </div>
          <div className="text-gray-500 text-xs tracking-widest uppercase">
            Access: <span className="text-[#ff4655]">Denied</span>
          </div>
        </div>
        <div className="text-gray-500 text-xs tracking-widest uppercase">
          Auth Guard: <span className="text-[#00ece0]">Active</span>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-8">
        <div className="text-center max-w-2xl">
          <ShieldOff className="w-12 h-12 text-[#ff4655] mx-auto mb-6" />
          <h1 className="text-white text-2xl font-bold uppercase tracking-[0.3em] mb-4">
            Acceso no autorizado
          </h1>
          <div className="relative mb-4">
            <h2 className="text-[#ff4655] text-[120px] sm:text-[160px] font-bold leading-none tracking-tighter">
              403
            </h2>
          </div>
          <h3 className="text-[#ff4655] text-xl font-bold uppercase tracking-[0.2em] mb-6">
            Permisos insuficientes
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-lg mx-auto">
            Tu sesión no tiene el rol necesario para entrar a este sector. Si crees que es un error,
            inicia sesión con otra cuenta o vuelve a una zona permitida.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleReturn}
              className="group relative px-8 py-4 bg-transparent border-2 border-[#00ece0] text-[#00ece0] text-sm font-bold uppercase tracking-[0.2em] transition-all duration-300 hover:bg-[#00ece0]/10"
            >
              <span className="flex items-center gap-3">
                <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                Volver
              </span>
            </button>
            {user && (
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="px-8 py-4 border-2 border-gray-600 text-gray-300 text-sm font-bold uppercase tracking-[0.2em] hover:border-white hover:text-white transition-colors"
              >
                Cambiar cuenta
              </button>
            )}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
          25% { transform: translateY(-100px) rotate(45deg); opacity: 0.5; }
          50% { transform: translateY(-50px) rotate(-45deg); opacity: 0.2; }
          75% { transform: translateY(-150px) rotate(90deg); opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default Unauthorized;
