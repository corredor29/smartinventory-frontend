import type { CartItem } from '../context/CartContext';
import type { PaymentMethod } from '../types/order';
import { fmtCurrency } from '../utils/currency';

export type { PaymentMethod };

const CLIP_BTN = 'polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)';

interface CheckoutInvoiceProps {
  invoiceId: string;
  items: CartItem[];
  totalItems: number;
  paymentMethod: PaymentMethod | null;
  onPaymentChange: (method: PaymentMethod) => void;
  onBack: () => void;
  onFinalize: () => void;
  isProcessing: boolean;
}

const paymentOptions: { id: PaymentMethod; label: string; desc: string; icon: string }[] = [
  { id: 'efectivo', label: 'Efectivo', desc: 'Pago en punto de entrega o tienda física', icon: '💵' },
  { id: 'tarjeta', label: 'Tarjeta', desc: 'Débito o crédito — procesamiento inmediato', icon: '💳' },
];

export function CheckoutInvoice({
  invoiceId,
  items,
  totalItems,
  paymentMethod,
  onPaymentChange,
  onBack,
  onFinalize,
  isProcessing,
}: CheckoutInvoiceProps) {
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = 0;
  const total = subtotal + tax;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          disabled={isProcessing}
          className="text-[10px] font-mono uppercase tracking-widest text-gray-500 hover:text-[#00ece0] transition-colors disabled:opacity-40"
        >
          ← Volver al carrito
        </button>
        <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
          Paso 2 de 2 — Pago
        </span>
      </div>

      <div
        className="bg-[#1f2326] border border-gray-800 overflow-hidden"
        style={{ clipPath: 'polygon(16px 0, 100% 0, 100% 100%, 0 100%, 0 16px)' }}
      >
        <div className="h-1 bg-gradient-to-r from-[#ff4655] via-[#00ece0] to-transparent" />

        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 pb-6 border-b border-gray-800">
            <div>
              <span className="text-[10px] font-mono text-[#00ece0] uppercase tracking-[0.3em]">Pre-factura</span>
              <h2 className="text-xl font-black text-white uppercase tracking-tight mt-1">Resumen de facturación</h2>
              <p className="text-gray-500 text-xs font-mono mt-1">
                Revisa tu pedido antes de seleccionar el método de pago
              </p>
            </div>
            <div className="text-left sm:text-right shrink-0">
              <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">N° de referencia</div>
              <div className="text-sm font-bold text-white font-mono mt-0.5">{invoiceId}</div>
              <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mt-2">Fecha</div>
              <div className="text-xs text-gray-400 font-mono">
                {new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="grid grid-cols-[1fr_auto_auto] gap-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest pb-2 border-b border-gray-800/60">
              <span>Producto</span>
              <span className="text-center w-12">Cant.</span>
              <span className="text-right w-24">Subtotal</span>
            </div>

            {items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="grid grid-cols-[1fr_auto_auto] gap-4 items-center py-2 border-b border-gray-800/40 last:border-0"
              >
                <div className="min-w-0">
                  <div className="text-sm text-white truncate">{product.name}</div>
                  <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">{product.category}</div>
                </div>
                <span className="text-sm font-mono text-gray-400 text-center w-12">{quantity}</span>
                <span className="text-sm font-mono text-[#00ece0] text-right w-24">
                  {fmtCurrency(product.price * quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-[#0f1923]/50 border border-gray-800/60 p-4 space-y-2 mb-8">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-gray-500 uppercase tracking-wider">Subtotal ({totalItems} uds)</span>
              <span className="text-white">{fmtCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-gray-500 uppercase tracking-wider">Impuestos</span>
              <span className="text-white">{fmtCurrency(tax)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-800">
              <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">Total a pagar</span>
              <span className="text-2xl font-black text-white font-mono">{fmtCurrency(total)}</span>
            </div>
          </div>

          <div>
            <div className="mb-3">
              <span className="text-[10px] font-mono text-[#ff4655] uppercase tracking-[0.3em]">Método de pago</span>
              <p className="text-xs text-gray-500 mt-1">Selecciona una opción para continuar *</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Método de pago">
              {paymentOptions.map((option) => {
                const selected = paymentMethod === option.id;
                return (
                  <label
                    key={option.id}
                    className={`relative flex items-start gap-4 p-4 border cursor-pointer transition-all ${
                      selected
                        ? 'border-[#00ece0] bg-[#00ece0]/5 shadow-[0_0_20px_rgba(0,236,224,0.08)]'
                        : 'border-gray-800 bg-[#0f1923]/30 hover:border-gray-600'
                    }`}
                    style={{ clipPath: CLIP_BTN }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={option.id}
                      checked={selected}
                      onChange={() => onPaymentChange(option.id)}
                      className="sr-only"
                    />
                    <span className="text-2xl shrink-0">{option.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white uppercase tracking-wide font-mono">
                          {option.label}
                        </span>
                        {selected && (
                          <span className="text-[9px] font-mono text-[#00ece0] uppercase tracking-widest">
                            Seleccionado
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{option.desc}</p>
                    </div>
                    <span
                      className={`w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${
                        selected ? 'border-[#00ece0]' : 'border-gray-600'
                      }`}
                    >
                      {selected && <span className="w-2 h-2 rounded-full bg-[#00ece0]" />}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <button
            onClick={onFinalize}
            disabled={!paymentMethod || isProcessing}
            className="w-full mt-8 py-3.5 bg-[#ff4655] hover:bg-[#e63e4c] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold uppercase tracking-widest transition-colors"
            style={{ clipPath: CLIP_BTN }}
          >
            {isProcessing ? 'Procesando compra...' : 'Finalizar compra'}
          </button>

          {!paymentMethod && (
            <p className="text-[10px] text-gray-600 font-mono text-center mt-3 uppercase tracking-wider">
              Debes seleccionar un método de pago para continuar
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
