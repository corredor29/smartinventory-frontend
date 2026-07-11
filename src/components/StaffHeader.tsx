import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

type StaffNavItem = {
  label: string;
  path: string;
  adminOnly?: boolean;
  aliases?: string[];
};

const NAV_ITEMS: StaffNavItem[] = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Productos', path: '/products', aliases: ['/armeria'] },
  { label: 'Categorías', path: '/categories', adminOnly: true },
  { label: 'Inventario', path: '/inventory', adminOnly: true, aliases: ['/almacenamiento'] },
  { label: 'Movimientos', path: '/movimientos', aliases: ['/inventory-movements'] },
  { label: 'Ventas', path: '/sales', aliases: ['/ventas'] },
  { label: 'Facturas', path: '/invoices', aliases: ['/economia'] },
  { label: 'Usuarios', path: '/users', adminOnly: true },
  { label: 'Clientes', path: '/customers' },
  { label: 'Soporte', path: '/support' },
];

type StaffHeaderProps = {
  title: React.ReactNode;
  subtitle: string;
  showReadOnly?: boolean;
  children?: React.ReactNode;
  trailing?: React.ReactNode;
};

export function StaffHeader({
  title,
  subtitle,
  showReadOnly = false,
  children,
  trailing,
}: StaffHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const roleLower = user?.role?.toLowerCase() ?? '';
  const isAdmin = roleLower === 'admin';
  const isReadOnly = showReadOnly && (roleLower === 'asesor' || roleLower === 'operator');

  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const isActive = (item: StaffNavItem) =>
    location.pathname === item.path ||
    (item.aliases?.includes(location.pathname) ?? false);

  const goTo = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <>
      <header className="sticky top-0 z-40 -mx-6 px-6 py-3 mb-6 bg-[#0d1117]/95 backdrop-blur border-b border-gray-800">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[9px] text-gray-500 uppercase tracking-[0.2em] font-mono">
              SMART<span className="text-[#ff4655]">//INV</span> · Admin
            </div>
            <div className="text-white text-sm font-bold uppercase tracking-wider truncate">
              {title}
            </div>
          </div>

          <div className="hidden xl:flex flex-wrap items-center justify-end gap-1.5 max-w-[70%]">
            {visibleItems.map((item) => {
              const active = isActive(item);
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => goTo(item.path)}
                  className={`px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-all border ${
                    active
                      ? 'text-[#00ece0] border-[#00ece0]/50 bg-[#00ece0]/10'
                      : 'text-zinc-400 border-gray-800 hover:text-[#00ece0] hover:bg-[#00ece0]/10'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {trailing}
            <div className="hidden sm:block px-2.5 py-1.5 bg-[#16191b] border border-gray-800">
              <span className="text-gray-500 text-[10px] uppercase tracking-wider">Rol:</span>
              <span
                className={`ml-1.5 text-[10px] font-bold uppercase ${
                  isAdmin ? 'text-[#ff4655]' : 'text-[#00ece0]'
                }`}
              >
                {isAdmin ? 'Admin' : 'Asesor'}
              </span>
            </div>

            {isReadOnly && (
              <div className="hidden md:flex px-2.5 py-1.5 bg-[#ff4655]/10 border border-[#ff4655]/30 items-center gap-1.5">
                <Lock className="w-3 h-3 text-[#ff4655]" />
                <span className="text-[#ff4655] text-[10px] font-bold uppercase tracking-wider">
                  Solo Lectura
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 text-[10px] font-mono uppercase tracking-wider transition-all"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="xl:hidden p-2 text-zinc-400 hover:text-[#00ece0] border border-gray-800 hover:border-[#00ece0]/40 transition-colors"
              aria-label="Abrir menú"
            >
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="xl:hidden mt-3 pt-3 border-t border-gray-800 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {visibleItems.map((item) => {
              const active = isActive(item);
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => goTo(item.path)}
                  className={`px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-left border transition-all ${
                    active
                      ? 'text-[#00ece0] border-[#00ece0]/50 bg-[#00ece0]/10'
                      : 'text-zinc-400 border-gray-800 hover:text-[#00ece0] hover:bg-[#00ece0]/10'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        )}
      </header>

      <div className="mb-6">
        <p className="text-gray-500 text-xs uppercase tracking-widest">{subtitle}</p>
        {children}
      </div>
    </>
  );
}