import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ClientNavbar } from '../components/ClientNavbar';
import { OrderItemsTable } from '../components/OrderItemsTable';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { useAuth } from '../context/AuthContext';
import { getMySales } from '../api/saleApi';
import { mapSaleToOrder } from '../utils/orderMappers';
import type { Order } from '../types/order';
import { fmtCurrency, fmtDate } from '../utils/currency';

const CLIP_BTN = 'polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)';

const paymentLabel = { efectivo: 'Efectivo', tarjeta: 'Tarjeta' } as const;

export function OrdersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const highlightOrderId = (location.state as { orderId?: string } | null)?.orderId;

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getMySales()
      .then((sales) => {
        if (!cancelled) setOrders(sales.map((sale) => mapSaleToOrder(sale, user.id)));
      })
      .catch((err) => {
        console.error('Error cargando pedidos:', err);
        if (!cancelled) {
          const status = err?.response?.status as number | undefined;
          setError(
            status === 401 || status === 403
              ? 'Tu sesión expiró. Cierra sesión e inicia de nuevo para ver tus pedidos.'
              : 'No se pudieron cargar tus pedidos. Intenta recargar la página.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (highlightOrderId) {
      setExpandedId(highlightOrderId);
    }
  }, [highlightOrderId]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-[#0f1923] font-sans">
      <ClientNavbar />

      <main className="max-w-4xl mx-auto px-6 sm:px-10 py-12">
        <div className="mb-8">
          <span className="text-[10px] font-mono text-[#00ece0] uppercase tracking-[0.3em]">Historial</span>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight mt-1">Mis Pedidos</h1>
          <p className="text-gray-500 text-sm mt-1 font-mono">
            {loading ? 'Cargando...' : `${orders.length} pedido${orders.length !== 1 ? 's' : ''} registrado${orders.length !== 1 ? 's' : ''}`}
          </p>
          {error && (
            <div className="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2">
              {error}
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-500 text-sm font-mono">Cargando pedidos...</div>
        ) : orders.length === 0 ? (
          <div
            className="text-center py-16 border border-gray-800 bg-[#1f2326]/50"
            style={{ clipPath: 'polygon(16px 0, 100% 0, 100% 100%, 0 100%, 0 16px)' }}
          >
            <div className="text-[#ff4655] font-mono text-xs uppercase tracking-[0.3em] mb-2">
              Sin pedidos
            </div>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              Aún no has realizado compras. Explora el catálogo y confirma tu primer pedido.
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-5 py-2.5 bg-[#ff4655] hover:bg-[#e63e4c] text-white text-xs font-bold uppercase tracking-widest transition-colors"
              style={{ clipPath: CLIP_BTN }}
            >
              Ir al catálogo
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isExpanded = expandedId === order.id;
              return (
                <div
                  key={order.id}
                  className="bg-[#1f2326] border border-gray-800 overflow-hidden"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}
                >
                  <button
                    onClick={() => toggleExpand(order.id)}
                    className="w-full p-5 text-left hover:bg-[#0f1923]/30 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-1">
                          <span className="text-sm font-bold text-white font-mono">{order.id}</span>
                          <OrderStatusBadge status={order.status} />
                        </div>
                        <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                          {fmtDate(order.createdAt)} · {order.totalItems} producto{order.totalItems !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">Total</div>
                          <div className="text-lg font-black text-[#00ece0] font-mono">{fmtCurrency(order.total)}</div>
                        </div>
                        <span className="text-gray-500 text-sm font-mono">{isExpanded ? '▲' : '▼'}</span>
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-gray-800/60 pt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 text-xs font-mono">
                        <div className="bg-[#0f1923]/50 border border-gray-800/60 p-3">
                          <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-1">Factura</div>
                          <div className="text-white">{order.invoiceId}</div>
                        </div>
                        <div className="bg-[#0f1923]/50 border border-gray-800/60 p-3">
                          <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-1">Pago</div>
                          <div className="text-white">{paymentLabel[order.paymentMethod]}</div>
                        </div>
                        <div className="bg-[#0f1923]/50 border border-gray-800/60 p-3">
                          <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-1">Estado</div>
                          <div className="text-white capitalize">{order.status.replace('_', ' ')}</div>
                        </div>
                      </div>

                      {(order.deliveryAddress || order.contactPhone || order.contactDocument) && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 text-xs font-mono">
                          {order.deliveryAddress && (
                            <div className="bg-[#0f1923]/50 border border-gray-800/60 p-3 sm:col-span-3">
                              <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-1">Dirección</div>
                              <div className="text-white break-words">{order.deliveryAddress}</div>
                            </div>
                          )}
                          {order.contactPhone && (
                            <div className="bg-[#0f1923]/50 border border-gray-800/60 p-3">
                              <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-1">Teléfono</div>
                              <div className="text-white">{order.contactPhone}</div>
                            </div>
                          )}
                          {order.contactDocument && (
                            <div className="bg-[#0f1923]/50 border border-gray-800/60 p-3">
                              <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-1">Documento</div>
                              <div className="text-white">{order.contactDocument}</div>
                            </div>
                          )}
                        </div>
                      )}

                      <OrderItemsTable
                        items={order.items}
                        totalItems={order.totalItems}
                        subtotal={order.subtotal}
                        tax={order.tax}
                        total={order.total}
                      />

                      <button
                        onClick={() => navigate('/facturas', { state: { invoiceId: order.invoiceId } })}
                        className="mt-4 text-[10px] font-mono uppercase tracking-widest text-[#00ece0] hover:text-white transition-colors"
                      >
                        Ver factura asociada →
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default OrdersPage;
