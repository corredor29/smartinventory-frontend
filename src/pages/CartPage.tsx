import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClientNavbar } from '../components/ClientNavbar';
import { CheckoutInvoice, type PaymentMethod } from '../components/CheckoutInvoice';
import { useCart, type CartItem } from '../context/CartContext';
import { generateInvoiceId, generateOrderId, useOrders } from '../context/OrdersContext';
import { useAuth } from '../context/AuthContext';
import { fmtCurrency } from '../utils/currency';

const CLIP_BTN = 'polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)';

type CheckoutStep = 'cart' | 'invoice' | 'success';

function generateCheckoutInvoiceId() {
  return generateInvoiceId();
}

export function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, totalPrice, totalItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const { addOrder } = useOrders();

  const [step, setStep] = useState<CheckoutStep>('cart');
  const [orderSnapshot, setOrderSnapshot] = useState<CartItem[]>([]);
  const [invoiceId, setInvoiceId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState('');
  const [completedTotal, setCompletedTotal] = useState(0);
  const [completedPayment, setCompletedPayment] = useState<PaymentMethod | null>(null);

  const handleConfirmCheckout = () => {
    setOrderSnapshot(items.map((item) => ({ ...item })));
    setInvoiceId(generateCheckoutInvoiceId());
    setPaymentMethod(null);
    setStep('invoice');
  };

  const handleBackToCart = () => {
    setStep('cart');
    setPaymentMethod(null);
  };

  const handleFinalizePurchase = async () => {
    if (!paymentMethod || orderSnapshot.length === 0 || !user) return;

    setIsProcessing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 900));

      const subtotal = orderSnapshot.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0,
      );
      const tax = 0;
      const total = subtotal + tax;
      const orderId = generateOrderId();

      addOrder({
        id: orderId,
        invoiceId,
        userId: user.id,
        items: orderSnapshot.map(({ product, quantity }) => ({
          productId: product.id,
          productName: product.name,
          category: product.category,
          image: product.image,
          unitPrice: product.price,
          quantity,
        })),
        totalItems: orderSnapshot.reduce((sum, item) => sum + item.quantity, 0),
        subtotal,
        tax,
        total,
        paymentMethod,
        status: 'confirmado',
        createdAt: new Date().toISOString(),
      });

      setCompletedOrderId(orderId);
      setCompletedTotal(total);
      setCompletedPayment(paymentMethod);
      clearCart();
      setStep('success');
    } finally {
      setIsProcessing(false);
    }
  };

  const snapshotItems = orderSnapshot.reduce((sum, item) => sum + item.quantity, 0);

  const pageTitle =
    step === 'cart' ? 'Carrito de compras' : step === 'invoice' ? 'Pre-factura y pago' : 'Compra exitosa';

  const pageSubtitle =
    step === 'cart'
      ? `${totalItems} unidad${totalItems !== 1 ? 'es' : ''} seleccionada${totalItems !== 1 ? 's' : ''}`
      : step === 'invoice'
        ? `Referencia ${invoiceId}`
        : 'Tu pedido ha sido procesado correctamente';

  return (
    <div className="min-h-screen bg-[#0f1923] font-sans">
      <ClientNavbar />

      <main className="max-w-4xl mx-auto px-6 sm:px-10 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-[10px] font-mono text-[#00ece0] uppercase tracking-[0.3em]">
              {step === 'success' ? 'Transacción completada' : 'Fase de compra'}
            </span>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight mt-1">{pageTitle}</h1>
            <p className="text-gray-500 text-sm mt-1 font-mono">{pageSubtitle}</p>
          </div>
          {step === 'cart' && items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-[10px] font-mono uppercase tracking-widest text-gray-500 hover:text-[#ff4655] transition-colors"
            >
              Vaciar carrito
            </button>
          )}
        </div>

        {step === 'success' ? (
          <div
            className="text-center py-16 border border-gray-800 bg-[#1f2326]/50"
            style={{ clipPath: 'polygon(16px 0, 100% 0, 100% 100%, 0 100%, 0 16px)' }}
          >
            <div className="w-16 h-16 mx-auto mb-6 bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <span className="text-3xl text-emerald-400">✓</span>
            </div>
            <div className="text-emerald-400 font-mono text-xs uppercase tracking-[0.3em] mb-2">
              Compra realizada con éxito
            </div>
            <p className="text-gray-500 text-sm font-mono mb-1">
              Pedido: {completedOrderId}
            </p>
            <p className="text-white text-lg font-semibold mb-1">
              Total pagado: {fmtCurrency(completedTotal)}
            </p>
            <p className="text-gray-500 text-sm font-mono mb-2">
              Método: {completedPayment === 'efectivo' ? 'Efectivo' : 'Tarjeta'}
            </p>
            <p className="text-gray-600 text-xs font-mono max-w-sm mx-auto mb-8">
              Tu pedido ha sido registrado. Puedes consultarlo en Mis Pedidos y Facturas.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/pedidos')}
                className="px-5 py-2.5 border border-[#00ece0]/40 text-[#00ece0] hover:bg-[#00ece0]/10 text-xs font-bold uppercase tracking-widest transition-colors"
                style={{ clipPath: CLIP_BTN }}
              >
                Ver mis pedidos
              </button>
              <button
                onClick={() => {
                  setStep('cart');
                  setPaymentMethod(null);
                  setOrderSnapshot([]);
                }}
                className="px-5 py-2.5 bg-[#ff4655] hover:bg-[#e63e4c] text-white text-xs font-bold uppercase tracking-widest transition-colors"
                style={{ clipPath: CLIP_BTN }}
              >
                Seguir comprando
              </button>
            </div>
          </div>
        ) : step === 'invoice' ? (
          <CheckoutInvoice
            invoiceId={invoiceId}
            items={orderSnapshot}
            totalItems={snapshotItems}
            paymentMethod={paymentMethod}
            onPaymentChange={setPaymentMethod}
            onBack={handleBackToCart}
            onFinalize={handleFinalizePurchase}
            isProcessing={isProcessing}
          />
        ) : items.length === 0 ? (
          <div className="text-center py-20 border border-gray-800 bg-[#1f2326]/50">
            <div className="text-[#ff4655] font-mono text-xs uppercase tracking-[0.3em] mb-2">Carrito vacío</div>
            <p className="text-gray-500 text-sm mb-6">Aún no has agregado equipos a tu loadout.</p>
            <button
              onClick={() => navigate('/')}
              className="px-5 py-2.5 bg-[#ff4655] hover:bg-[#e63e4c] text-white text-xs font-bold uppercase tracking-widest transition-colors"
              style={{ clipPath: CLIP_BTN }}
            >
              Explorar catálogo
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="bg-[#1f2326] border border-gray-800 p-4 flex gap-4 items-center"
                style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}
              >
                <div className="w-20 h-20 bg-[#0f1923]/60 border border-gray-800/50 flex items-center justify-center shrink-0">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="max-w-full max-h-full object-contain p-1"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{product.name}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mt-0.5">{product.category}</div>
                  <div className="text-sm font-bold text-white font-mono mt-2">{fmtCurrency(product.price)}</div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                    className="w-8 h-8 border border-gray-700 text-gray-400 hover:text-white hover:border-[#ff4655]/50 transition-colors text-lg"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-mono text-white">{quantity}</span>
                  <button
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                    disabled={quantity >= product.stock}
                    className="w-8 h-8 border border-gray-700 text-gray-400 hover:text-white hover:border-[#ff4655]/50 transition-colors text-lg disabled:opacity-30"
                  >
                    +
                  </button>
                </div>

                <div className="text-right shrink-0 hidden sm:block">
                  <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">Subtotal</div>
                  <div className="text-sm font-bold text-[#00ece0] font-mono">{fmtCurrency(product.price * quantity)}</div>
                </div>

                <button
                  onClick={() => removeFromCart(product.id)}
                  className="text-gray-600 hover:text-[#ff4655] transition-colors text-lg shrink-0"
                  aria-label="Eliminar"
                >
                  ×
                </button>
              </div>
            ))}

            <div className="bg-[#1f2326] border border-gray-800 p-6 mt-6">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Total del pedido</span>
                <span className="text-2xl font-black text-white font-mono">{fmtCurrency(totalPrice)}</span>
              </div>
              <p className="text-[10px] text-gray-600 font-mono mb-4 uppercase tracking-wider">
                Paso 1 de 2 — Revisión del carrito
              </p>
              <button
                onClick={handleConfirmCheckout}
                className="w-full py-3 bg-[#ff4655] hover:bg-[#e63e4c] text-white text-sm font-bold uppercase tracking-widest transition-colors"
                style={{ clipPath: CLIP_BTN }}
              >
                Confirmar compra
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default CartPage;
