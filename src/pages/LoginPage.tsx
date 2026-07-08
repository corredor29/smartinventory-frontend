import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import transitionGif from '../assets/register-transition.gif';

type Mode = 'login' | 'register';
type OverlayStage = 'idle' | 'covering' | 'covered' | 'revealing';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [overlayMounted, setOverlayMounted] = useState(false);
  const [overlayStage, setOverlayStage] = useState<OverlayStage>('idle');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ─── Animación de transición Login <-> Registro ────────────────────────
  // El gif arranca como un punto en el centro, crece hasta cubrir toda la
  // pantalla y, una vez cubierto, cambia el modo del formulario por debajo.
  // Después se reduce de nuevo revelando la vista ya cambiada.
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
      // TODO: reemplazar por la llamada real a authApi.ts (login/register contra el backend .NET)
      await new Promise((r) => setTimeout(r, 600));
      const role = email.toLowerCase().includes('asesor') ? 'Operator' : 'Admin';
      login('mock-token', {
        id: 'usr-1',
        username: email.split('@')[0] || 'agente',
        email,
        role: role as 'Admin' | 'Operator',
        agentName: name || undefined,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo procesar la solicitud');
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
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-[#1f2326] border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#ff4655] focus:ring-1 focus:ring-[#ff4655] transition-all"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Confirmar contraseña</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-[#1f2326] border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#ff4655] focus:ring-1 focus:ring-[#ff4655] transition-all"
                />
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
