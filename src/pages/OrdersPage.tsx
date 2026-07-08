import { ClientNavbar } from '../components/ClientNavbar';

export function OrdersPage() {
  return (
    <div className="min-h-screen bg-[#0f1923] font-sans">
      <ClientNavbar />
      <main className="max-w-4xl mx-auto px-6 sm:px-10 py-12">
        <span className="text-[10px] font-mono text-[#00ece0] uppercase tracking-[0.3em]">Historial</span>
        <h1 className="text-2xl font-black text-white uppercase tracking-tight mt-1 mb-6">Mis Pedidos</h1>
        <div className="text-white p-8 bg-[#1f2326] border-l-4 border-[#ff4655]">
          <p className="text-sm text-gray-400 font-mono">
            Aquí aparecerán tus pedidos confirmados. Módulo pendiente de integración con el backend.
          </p>
        </div>
      </main>
    </div>
  );
}

export default OrdersPage;
