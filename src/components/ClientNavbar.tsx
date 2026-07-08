import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const CLIP_BTN = 'polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-[10px] font-mono uppercase tracking-widest transition-colors ${
    isActive ? 'text-[#00ece0]' : 'text-gray-500 hover:text-[#00ece0]'
  }`;

export function ClientNavbar() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { totalItems } = useCart();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-[#1f2326] border-b border-gray-800 sticky top-0 z-40">
      <div className="px-6 sm:px-10 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate('/')} className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-[#ff4655] rotate-45 flex items-center justify-center flex-shrink-0">
              <div className="w-3 h-3 bg-[#0f1923] -rotate-45" />
            </div>
            <div className="min-w-0 text-left">
              <span className="text-white font-bold text-lg tracking-tight font-mono block leading-none">
                SMART<span className="text-[#ff4655]">//INV</span>
              </span>
              <span className="text-[9px] text-gray-500 uppercase tracking-[0.25em] font-mono hidden sm:block">
                Electrodomésticos · Estilo Táctico
              </span>
            </div>
          </button>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <NavLink to="/" end className={navLinkClass}>
            Catálogo
          </NavLink>

          {isAuthenticated && (
            <>
              <NavLink to="/carrito" className={navLinkClass}>
                <span className="flex items-center gap-1.5">
                  Carrito
                  {totalItems > 0 && (
                    <span className="bg-[#ff4655] text-white text-[9px] font-bold px-1.5 py-0.5 min-w-[18px] text-center">
                      {totalItems}
                    </span>
                  )}
                </span>
              </NavLink>
              <NavLink to="/pedidos" className={navLinkClass}>
                Mis Pedidos
              </NavLink>
              <NavLink to="/facturas" className={navLinkClass}>
                Facturas
              </NavLink>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          {isAuthenticated ? (
            <>
              <span className="hidden sm:block text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                {user?.username}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-gray-700 hover:border-[#ff4655]/50 text-gray-400 hover:text-white text-xs font-bold uppercase tracking-wide transition-colors"
                style={{ clipPath: CLIP_BTN }}
              >
                Salir
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-[#ff4655] hover:bg-[#e63e4c] text-white text-xs font-bold uppercase tracking-wide transition-colors"
              style={{ clipPath: CLIP_BTN }}
            >
              Iniciar sesión
            </button>
          )}
        </div>
      </div>

      {isAuthenticated && (
        <nav className="md:hidden flex items-center gap-4 px-6 py-2 border-t border-gray-800/60 overflow-x-auto">
          <NavLink to="/carrito" className={navLinkClass}>
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              Carrito
              {totalItems > 0 && (
                <span className="bg-[#ff4655] text-white text-[9px] font-bold px-1.5 py-0.5 min-w-[18px] text-center">
                  {totalItems}
                </span>
              )}
            </span>
          </NavLink>
          <NavLink to="/pedidos" className={navLinkClass}>
            <span className="whitespace-nowrap">Mis Pedidos</span>
          </NavLink>
          <NavLink to="/facturas" className={navLinkClass}>
            <span className="whitespace-nowrap">Facturas</span>
          </NavLink>
        </nav>
      )}

      <div className="bg-[#16191b] border-b border-gray-800/80 px-6 sm:px-10 py-1.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">En línea</span>
        </div>
        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider truncate hidden sm:block">
          {isAuthenticated
            ? `Sesión activa // ${user?.role === 'Client' ? 'Cliente' : user?.role}`
            : 'Cliente invitado // Solo catálogo disponible'}
        </p>
        <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest shrink-0">
          REG: <span className="text-gray-400">LATAM-BGA</span>
        </span>
      </div>
    </header>
  );
}
