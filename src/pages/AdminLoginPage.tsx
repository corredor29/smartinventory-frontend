import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { login as loginApi } from '../api/authApi';

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

export const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await loginApi({ email, password });
      const role = mapBackendRole(result.role);

      if (role === 'Client') {
        setError('Credenciales no autorizadas para acceso administrativo');
        return;
      }

      login(result.token, {
        id: String(result.userId ?? result.email),
        username: result.name,
        email: result.email,
        role,
        agentName: result.name || undefined,
        userId: result.userId,
        customerId: result.customerId ?? null,
      });
      navigate('/dashboard');
    } catch (err: unknown) {
      const backendMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(backendMessage || 'Error de autenticación. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const CLIP_INPUT = 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)';
  const CLIP_BTN = 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1923] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#ff4655] rotate-45 mb-4">
            <Shield className="w-8 h-8 text-[#0f1923] -rotate-45" />
          </div>
          <h1 className="text-2xl font-bold text-white font-mono tracking-wider uppercase">
            ACCESO <span className="text-[#ff4655]">ADMIN</span>
          </h1>
          <p className="text-gray-500 text-xs mt-2 font-mono uppercase tracking-widest">
            Portal Interno // Personal Autorizado
          </p>
        </div>

        <div className="bg-[#1f2326] border border-gray-800 p-6 relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#ff4655]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#ff4655]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#ff4655]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#ff4655]" />

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Lock className="w-3 h-3" />
                Credencial de Acceso
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@smartinv.internal"
                className="w-full px-4 py-3 bg-[#16191b] border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#00ece0] focus:ring-1 focus:ring-[#00ece0] transition-all font-mono"
                style={{ clipPath: CLIP_INPUT }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Lock className="w-3 h-3" />
                Código de Seguridad
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 bg-[#16191b] border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#00ece0] focus:ring-1 focus:ring-[#00ece0] transition-all font-mono pr-12"
                  style={{ clipPath: CLIP_INPUT }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#00ece0] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/30 px-4 py-3 font-mono uppercase tracking-wider">
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ff4655] hover:bg-[#e63e4c] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold uppercase tracking-widest py-3 text-sm transition-all duration-200 hover:shadow-lg hover:shadow-[#ff4655]/20"
              style={{ clipPath: CLIP_BTN }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  AUTENTICANDO...
                </span>
              ) : (
                'INGRESAR AL SISTEMA'
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-800">
            <p className="text-[10px] text-gray-600 font-mono uppercase tracking-wider mb-3">Niveles de Acceso:</p>
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-[#ff4655] mt-1.5 flex-shrink-0" />
                <div>
                  <span className="text-gray-300 font-semibold">Admin</span>
                  <span className="text-gray-500 ml-2">- Control total del sistema</span>
                </div>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00ece0] mt-1.5 flex-shrink-0" />
                <div>
                  <span className="text-gray-300 font-semibold">Asesor</span>
                  <span className="text-gray-500 ml-2">- Solo visualización</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="w-full py-2 border border-gray-700 hover:border-[#00ece0] text-gray-500 hover:text-[#00ece0] text-xs font-bold uppercase tracking-wider transition-colors"
            style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
          >
            ← Volver al inicio
          </button>
          <p className="text-[10px] text-gray-700 font-mono uppercase tracking-widest mt-4">
            SMART//INV // SISTEMA SEGURO v2.4.1
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
