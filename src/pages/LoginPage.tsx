import React, { useState } from 'react';

export const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="relative min-h-screen w-full bg-[#0f1923] text-gray-200 flex items-center justify-center overflow-hidden font-mono select-none">
      
      {/* CONTENEDOR PRINCIPAL PADRE (Ocupa toda la pantalla) */}
      <div className="relative w-full min-h-screen flex flex-col md:flex-row">
        
        {/* ================= SECCIÓN DE INFORMACIÓN TÁCTICA ================= */}
        {/* Se desliza hacia la derecha en modo Registro usando md:translate-x-full */}
        <div 
          className={`w-full md:w-1/2 bg-[#16191b] p-8 md:p-16 flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 border-[#ff4655]/10 z-20
            transition-transform duration-700 ease-in-out
            ${isLogin ? 'translate-x-0' : 'md:translate-x-full md:border-l md:border-r-0'}
          `}
        >
          {/* Luces de fondo decorativas */}
          <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[#ff4655]/5 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#00ece0]/5 blur-[100px] pointer-events-none" />

          {/* Logo del Sistema */}
          <div className="flex flex-col z-10">
            <span className="text-[#ff4655] font-bold text-2xl tracking-[0.2em]">SMART//INV</span>
            <span className="text-[10px] text-gray-500 tracking-widest uppercase mt-1">Suministro de Hardware Táctico</span>
          </div>

          {/* Información Central */}
          <div className="my-auto py-12 md:py-0 z-10 max-w-md">
            <span className="px-3 py-1 text-[10px] font-bold bg-[#ff4655]/10 text-[#ff4655] border border-[#ff4655]/20 inline-block mb-6 tracking-widest uppercase">
              PROTOCOLO DE CONTROL // V2.4
            </span>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight mb-4">
              Gestión de arsenales e <span className="text-[#00ece0]">inventario</span> de alto rendimiento.
            </h1>
            <p className="text-gray-400 text-xs md:text-sm mb-8 leading-relaxed font-sans">
              Optimiza tus flujos de almacenamiento, administra el catálogo de hardware premium de forma automatizada y mantén sincronizados los créditos de facturación en tiempo real.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-800">
              <div>
                <p className="text-xl font-bold text-white">99.9%</p>
                <p className="text-[9px] text-gray-500 uppercase tracking-wider">Disponibilidad de Red</p>
              </div>
              <div>
                <p className="text-xl font-bold text-[#00ece0]">&lt; 20ms</p>
                <p className="text-[9px] text-gray-500 uppercase tracking-wider">Latencia de Servidor</p>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-gray-600 z-10 uppercase tracking-wider">
            REG_STATION // LATAM_BUCARAMANGA
          </div>
        </div>

        {/* ================= SECCIÓN DE FORMULARIOS (LOGIN / REGISTRO) ================= */}
        {/* Se desliza hacia la izquierda en modo Registro usando md:-translate-x-full */}
        <div 
          className={`w-full md:w-1/2 p-8 md:p-16 flex items-center justify-center bg-[#1f2326] relative z-10
            transition-transform duration-700 ease-in-out
            ${isLogin ? 'translate-x-0' : 'md:-translate-x-full'}
          `}
        >
          <div className="w-full max-w-sm relative">
            
            {/* ENVOLTORIO LOGIN: Se desvanece si no está activo */}
            <div className={`space-y-6 transition-all duration-500 ${isLogin ? 'opacity-100 pointer-events-auto scale-100' : 'absolute inset-0 opacity-0 pointer-events-none scale-95'}`}>
              <div className="space-y-1 border-l-2 border-[#ff4655] pl-3">
                <h2 className="text-xl font-bold tracking-wider uppercase text-white">Iniciar Sesión</h2>
                <p className="text-gray-400 text-[10px] uppercase tracking-wider">Establecer enlace de operaciones.</p>
              </div>

              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Identificación / Email</label>
                  <input type="email" placeholder="agente@smartinv.com" className="w-full px-4 py-3 text-xs bg-[#0f1923] border border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:border-[#ff4655] transition-all font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Código de Acceso</label>
                  <input type="password" placeholder="••••••••" className="w-full px-4 py-3 text-xs bg-[#0f1923] border border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:border-[#ff4655] transition-all font-mono" />
                </div>
                <button className="w-full py-3 bg-[#ff4655] hover:bg-[#e03e4b] font-bold text-xs uppercase tracking-widest text-white shadow-lg active:scale-[0.99] transition-all border border-[#ff4655]">
                  Acceder al Servidor
                </button>
              </form>

              <div className="text-center text-[11px] text-gray-400 pt-2">
                ¿No estás registrado?{' '}
                <button onClick={() => setIsLogin(false)} className="font-bold text-[#00ece0] hover:underline uppercase tracking-wider">
                  Crear Cuenta
                </button>
              </div>
            </div>

            {/* ENVOLTORIO REGISTRO: Se desvanece si no está activo */}
            <div className={`space-y-6 transition-all duration-500 ${!isLogin ? 'opacity-100 pointer-events-auto scale-100' : 'absolute inset-0 opacity-0 pointer-events-none scale-95'}`}>
              <div className="space-y-1 border-l-2 border-[#00ece0] pl-3">
                <h2 className="text-xl font-bold tracking-wider uppercase text-white">Registro de Agente</h2>
                <p className="text-gray-400 text-[10px] uppercase tracking-wider">Dar de alta credenciales en la base de datos.</p>
              </div>

              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nombre del Operador</label>
                  <input type="text" placeholder="Ej. Killjoy, Phoenix" className="w-full px-4 py-3 text-xs bg-[#0f1923] border border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:border-[#00ece0] transition-all font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Enlace de Correo</label>
                  <input type="email" placeholder="nombre@smartinv.com" className="w-full px-4 py-3 text-xs bg-[#0f1923] border border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:border-[#00ece0] transition-all font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Establecer Contraseña</label>
                  <input type="password" placeholder="••••••••" className="w-full px-4 py-3 text-xs bg-[#0f1923] border border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:border-[#00ece0] transition-all font-mono" />
                </div>
                <button className="w-full py-3 bg-[#00ece0] hover:bg-[#00c8be] font-bold text-xs uppercase tracking-widest text-black shadow-lg active:scale-[0.99] transition-all border border-[#00ece0]">
                  Registrar Credenciales
                </button>
              </form>

              <div className="text-center text-[11px] text-gray-400 pt-2">
                ¿Ya tienes cuenta?{' '}
                <button onClick={() => setIsLogin(true)} className="font-bold text-[#ff4655] hover:underline uppercase tracking-wider">
                  Volver a Login
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};