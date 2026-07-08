import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ClientNavbar } from '../components/ClientNavbar';
import { OrderItemsTable } from '../components/OrderItemsTable';
import { useOrders } from '../context/OrdersContext';
import { fmtCurrency, fmtDate } from '../utils/currency';

const CLIP_BTN = 'polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)';

const paymentLabel = { efectivo: 'Efectivo', tarjeta: 'Tarjeta' } as const;

export function InvoicesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orders } = useOrders();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const highlightInvoiceId = (location.state as { invoiceId?: string } | null)?.invoiceId;

  useEffect(() => {
    if (highlightInvoiceId) {
      setSelectedInvoiceId(highlightInvoiceId);
      return;
    }
    if (!selectedInvoiceId && orders.length > 0) {
      setSelectedInvoiceId(orders[0].invoiceId);
    }
  }, [highlightInvoiceId, orders, selectedInvoiceId]);

  const selectedOrder = selectedInvoiceId
    ? orders.find((order) => order.invoiceId === selectedInvoiceId)
    : null;

  return (
    <div className="min-h-screen bg-[#0f1923] font-sans">
      <ClientNavbar />

      <main className="max-w-4xl mx-auto px-6 sm:px-10 py-12">
        <div className="mb-8">
          <span className="text-[10px] font-mono text-[#00ece0] uppercase tracking-[0.3em]">Facturación</span>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight mt-1">Facturas</h1>
          <p className="text-gray-500 text-sm mt-1 font-mono">
            {orders.length} factura{orders.length !== 1 ? 's' : ''} emitida{orders.length !== 1 ? 's' : ''}
          </p>
        </div>

        {orders.length === 0 ? (
          <div
            className="text-center py-16 border border-gray-800 bg-[#1f2326]/50"
            style={{ clipPath: 'polygon(16px 0, 100% 0, 100% 100%, 0 100%, 0 16px)' }}
          >
            <div className="text-[#00ece0] font-mono text-xs uppercase tracking-[0.3em] mb-2">
              Sin facturas
            </div>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              Las facturas se generan automáticamente al completar una compra.
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
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            <aside className="space-y-2">
              {orders.map((order) => {
                const isSelected = selectedInvoiceId === order.invoiceId;
                return (
                  <button
                    key={order.invoiceId}
                    onClick={() => setSelectedInvoiceId(order.invoiceId)}
                    className={`w-full text-left p-4 border transition-all ${
                      isSelected
                        ? 'border-[#00ece0] bg-[#00ece0]/5'
                        : 'border-gray-800 bg-[#1f2326] hover:border-gray-600'
                    }`}
                    style={{ clipPath: CLIP_BTN }}
                  >
                    <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">
                      {fmtDate(order.createdAt)}
                    </div>
                    <div className="text-sm font-bold text-white font-mono truncate">{order.invoiceId}</div>
                    <div className="text-sm font-mono text-[#00ece0] mt-1">{fmtCurrency(order.total)}</div>
                  </button>
                );
              })}
            </aside>

            <section>
              {selectedOrder ? (
                <div
                  className="bg-[#1f2326] border border-gray-800 overflow-hidden"
                  style={{ clipPath: 'polygon(16px 0, 100% 0, 100% 100%, 0 100%, 0 16px)' }}
                >
                  <div className="h-1 bg-gradient-to-r from-[#ff4655] via-[#00ece0] to-transparent" />

                  <div className="p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 pb-6 border-b border-gray-800">
                      <div>
                        <span className="text-[10px] font-mono text-[#00ece0] uppercase tracking-[0.3em]">
                          Factura emitida
                        </span>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight mt-1">
                          {selectedOrder.invoiceId}
                        </h2>
                        <p className="text-gray-500 text-xs font-mono mt-1">
                          Pedido asociado: {selectedOrder.id}
                        </p>
                      </div>
                      <div className="text-left sm:text-right shrink-0 space-y-2">
                        <div>
                          <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">Fecha</div>
                          <div className="text-xs text-gray-400 font-mono">{fmtDate(selectedOrder.createdAt)}</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">Método de pago</div>
                          <div className="text-xs text-white font-mono">
                            {paymentLabel[selectedOrder.paymentMethod]}
                          </div>
                        </div>
                      </div>
                    </div>

                    <OrderItemsTable
                      items={selectedOrder.items}
                      totalItems={selectedOrder.totalItems}
                      subtotal={selectedOrder.subtotal}
                      tax={selectedOrder.tax}
                      total={selectedOrder.total}
                    />

                    <div className="mt-6 pt-4 border-t border-gray-800 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                      <p className="text-[10px] text-gray-600 font-mono uppercase tracking-wider">
                        Documento generado al confirmar la compra
                      </p>
                      <button
                        onClick={() => navigate('/pedidos', { state: { orderId: selectedOrder.id } })}
                        className="text-[10px] font-mono uppercase tracking-widest text-[#00ece0] hover:text-white transition-colors shrink-0"
                      >
                        Ver pedido asociado →
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full min-h-[280px] border border-dashed border-gray-800 bg-[#1f2326]/30">
                  <p className="text-gray-500 text-sm font-mono uppercase tracking-wider">
                    Selecciona una factura para ver el detalle
                  </p>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default InvoicesPage;
