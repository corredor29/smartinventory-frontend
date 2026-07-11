import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getProductById } from '../api/productApi';
import { login as loginApi, register as registerApi } from '../api/authApi';
import transitionGif from '../assets/register-transition.gif';

type Mode = 'login' | 'register';
type OverlayStage = 'idle' | 'covering' | 'covered' | 'revealing';

interface LoginLocationState {
  from?: { pathname: string };
  intent?: 'buy';
  productId?: string;
}
function mapBackendRole(role: string): 'admin' | 'asesor' | 'Client' {
  switch (role) {
    case 'Administrador':
      return 'admin';
    case 'Asesor':
      return 'asesor';
    default:
      return 'Client';
  }
}

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { addToCart } = useCart();
  const loginState = (location.state as LoginLocationState) ?? {};

  const [mode, setMode] = useState<Mode>('login');
  const [overlayMounted, setOverlayMounted] = useState(false);
  const [overlayStage, setOverlayStage] = useState<OverlayStage>('idle');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ─── Animación de transición Login <-> Registro ────────────────────────
  const switchMode = (target: Mode) => {
    if (target === mode) return;
    setError(null);
    setOverlayMounted(true);
    setOverlayStage('idle');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => setOverlayStage('covering'));
    });

    setTimeout(() => {
      setOverlayStage('covered');
      setMode(target);
    }, 700);

    setTimeout(() => {
      setOverlayStage('revealing');
    }, 950);

    setTimeout(() => {
      setOverlayMounted(false);
      setOverlayStage('idle');
    }, 1650);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'register' && password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const result =
        mode === 'register'
          ? await registerApi({ name, email, password })
          : await loginApi({ email, password });

      const role = mapBackendRole(result.role);

      login(result.token, {
        id: String(result.userId ?? result.email),
        username: result.name,
        email: result.email,
        role,
        agentName: name || undefined,
        userId: result.userId,
        customerId: result.customerId ?? null,
      });

      if (role === 'Client') {
        if (loginState.intent === 'buy' && loginState.productId) {
          try {
            const product = await getProductById(loginState.productId);
            addToCart(product);
          } catch {
            // Si el producto ya no existe, igual redirigimos al carrito
          }
          navigate('/carrito');
        } else {
          navigate(loginState.from?.pathname || '/');
        }
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const backendMessage = err?.response?.data?.message;
      setError(
        backendMessage ||
          (mode === 'register'
            ? 'No se pudo completar el registro. Intenta de nuevo.'
            : 'Email o contraseña incorrectos.')
      );
    } finally {
      setLoading(false);
    }
  };

  const clipPath =
    overlayStage === 'idle'
      ? 'circle(0% at 50% 50%)'
      : overlayStage === 'covering' || overlayStage === 'covered'
      ? 'circle(150% at 50% 50%)'
      : 'circle(0% at 50% 50%)';

  return (
    <div className="min-h-screen flex bg-[#0f1923] font-sans">
      {/* ── Panel izquierdo: información de marca ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r border-gray-800 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, #ff4655 0 2px, transparent 2px 42px)' }}
        />
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 bg-[#ff4655] rotate-45 flex items-center justify-center flex-shrink-0">
            <div className="w-3.5 h-3.5 bg-[#0f1923] -rotate-45" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight font-mono">
            SMART<span className="text-[#ff4655]">//INV</span>
          </span>
        </div>

        <div className="relative">
          <span className="text-[#00ece0] text-xs font-bold uppercase tracking-[0.3em] font-mono">
            {mode === 'login' ? 'Acceso táctico' : 'Nuevo agente'}
          </span>
          <h1 className="text-4xl font-black text-white leading-[1.15] mt-4 mb-5 uppercase">
            {mode === 'login' ? (
              <>Controla tu inventario<br />como un profesional.</>
            ) : (
              <>Únete al equipo<br />y opera sin límites.</>
            )}
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
            Gestiona productos, ventas y facturas con un chatbot inteligente que automatiza tus operaciones comerciales.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-3 max-w-sm">
            {[
              { label: 'Productos activos', value: '248' },
              { label: 'Ventas hoy', value: '$12,450' },
              { label: 'Bajo stock', value: '14' },
              { label: 'Ventas chatbot', value: '37' },
            ].map((s) => (
              <div key={s.label} className="bg-white/5 border border-gray-800 p-4">
                <div className="text-2xl font-bold text-white font-mono">{s.value}</div>
                <div className="text-gray-500 text-xs mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-gray-600 text-xs font-mono">SMART//INV — SISTEMA DE GESTIÓN TÁCTICA</p>
      </div>

      {/* ── Panel derecho: formulario ── */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="w-full max-w-sm relative z-10">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-7 h-7 bg-[#ff4655] rotate-45 flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-[#0f1923] -rotate-45" />
            </div>
            <span className="text-white font-bold font-mono">SMART//INV</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1 uppercase tracking-tight">
            {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </h2>
          <p className="text-gray-500 text-sm mb-8">
            {mode === 'login' ? 'Accede a tu panel de control' : 'Regístrate para comenzar a operar'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Nombre</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full px-3.5 py-2.5 bg-[#1f2326] border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#ff4655] focus:ring-1 focus:ring-[#ff4655] transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Correo electrónico</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full px-3.5 py-2.5 bg-[#1f2326] border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#ff4655] focus:ring-1 focus:ring-[#ff4655] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-11 bg-[#1f2326] border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#ff4655] focus:ring-1 focus:ring-[#ff4655] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#ff4655] transition-colors"
                  title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Confirmar contraseña</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 pr-11 bg-[#1f2326] border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#ff4655] focus:ring-1 focus:ring-[#ff4655] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#ff4655] transition-colors"
                    title={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ff4655] hover:bg-[#e63e4c] disabled:opacity-60 text-white font-bold uppercase tracking-wide py-2.5 text-sm transition-colors mt-1"
              style={{ clipPath: 'polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)' }}
            >
              {loading ? 'Procesando...' : mode === 'login' ? 'Ingresar al sistema' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {mode === 'login' ? (
              <>
                ¿No tienes cuenta?{' '}
                <button onClick={() => switchMode('register')} className="text-[#00ece0] font-semibold hover:underline">
                  Regístrate
                  
                </button>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?{' '}
                <button onClick={() => switchMode('login')} className="text-[#00ece0] font-semibold hover:underline">
                  Inicia sesión
                </button>
              </>
            )}
          </p>

          <button
            onClick={() => navigate('/')}
            className="w-full mt-4 py-2 border border-gray-700 hover:border-[#00ece0] text-gray-500 hover:text-[#00ece0] text-xs font-bold uppercase tracking-wider transition-colors"
            style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
          >
            ← Volver al inicio
          </button>
        </div>
      </div>

      {/* ── Overlay de transición (gif) ── */}
      {overlayMounted && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1923] pointer-events-none transition-[clip-path] duration-700 ease-in-out"
          style={{ clipPath }}
        >
          <img src={transitionGif} alt="" className="w-32 h-32 sm:w-40 sm:h-40 object-contain rounded-full shadow-2xl" />
        </div>
      )}
    </div>
  );
};

export default LoginPage;