import { useEffect, useState } from 'react';
import { fmtCurrency } from '../../utils/currency';
import type { PaymentMethod } from '../../types/order';
import type { ChatUiProduct } from '../../utils/chatHistory';
import {
  CARD_BANKS,
  ChatInteractiveCard,
  formatCardNumber,
  formatExpiry,
  PaymentSimulationNotice,
  type CardBank,
  type CardFormData,
  type CardKind,
} from './ChatInteractiveCard';

export interface CheckoutCartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface CheckoutFormValues {
  customerName: string;
  contactPhone: string;
  contactDocument: string;
  deliveryAddress: string;
  paymentMethod: PaymentMethod;
  /** Credito o debito cuando paymentMethod es tarjeta */
  cardKind?: CardKind;
  items: CheckoutCartItem[];
}

interface ChatCheckoutFormProps {
  items: CheckoutCartItem[];
  initialName?: string;
  initialPhone?: string;
  initialDocument?: string;
  initialAddress?: string;
  submitting?: boolean;
  onSubmit: (values: CheckoutFormValues) => void;
  onCancel?: () => void;
  onAddMore?: () => void;
}

const PAYMENTS: { id: PaymentMethod; label: string }[] = [
  { id: 'efectivo', label: 'Efectivo' },
  { id: 'tarjeta', label: 'Tarjeta' },
];

export function ChatCheckoutForm({
  items: initialItems,
  initialName = '',
  initialPhone = '',
  initialDocument = '',
  initialAddress = '',
  submitting = false,
  onSubmit,
  onCancel,
  onAddMore,
}: ChatCheckoutFormProps) {
  const [items, setItems] = useState<CheckoutCartItem[]>(initialItems);
  const [customerName, setCustomerName] = useState(initialName);
  const [contactPhone, setContactPhone] = useState(initialPhone);
  const [contactDocument, setContactDocument] = useState(initialDocument);
  const [deliveryAddress, setDeliveryAddress] = useState(initialAddress);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [cardKind, setCardKind] = useState<CardKind>('credito');
  const [cardBank, setCardBank] = useState<CardBank>('nu');
  const [card, setCard] = useState<CardFormData>({
    number: '',
    holder: '',
    expiry: '',
    cvv: '',
  });
  const [cardFlipped, setCardFlipped] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    if (initialName) setCustomerName((v) => v || initialName);
  }, [initialName]);
  useEffect(() => {
    if (initialPhone) setContactPhone((v) => v || initialPhone);
  }, [initialPhone]);
  useEffect(() => {
    if (initialDocument) setContactDocument((v) => v || initialDocument);
  }, [initialDocument]);
  useEffect(() => {
    if (initialAddress) setDeliveryAddress((v) => v || initialAddress);
  }, [initialAddress]);

  // Prefill titular con el nombre del formulario
  useEffect(() => {
    if (customerName.trim() && !card.holder.trim()) {
      setCard((c) => ({ ...c, holder: customerName }));
    }
  }, [customerName, card.holder]);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const setQty = (productId: string, qty: number) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.productId === productId ? { ...i, quantity: Math.max(1, Math.min(100, qty)) } : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const validateCard = () => {
    const digits = card.number.replace(/\D/g, '');
    if (digits.length < 15) return 'Numero de tarjeta incompleto.';
    if (!card.holder.trim()) return 'Ingresa el nombre del titular.';
    if (!/^\d{2}\/\d{2}$/.test(card.expiry)) return 'Fecha invalida (MM/YY).';
    if (card.cvv.replace(/\D/g, '').length < 3) return 'CVV incompleto.';
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setLocalError('Agrega al menos un producto.');
      return;
    }
    if (
      !customerName.trim() ||
      !contactPhone.trim() ||
      !contactDocument.trim() ||
      !deliveryAddress.trim() ||
      !paymentMethod
    ) {
      setLocalError('Completa nombre, telefono, documento, direccion y metodo de pago.');
      return;
    }
    if (paymentMethod === 'tarjeta') {
      const cardErr = validateCard();
      if (cardErr) {
        setLocalError(cardErr);
        return;
      }
    }
    setLocalError(null);
    onSubmit({
      customerName: customerName.trim(),
      contactPhone: contactPhone.trim(),
      contactDocument: contactDocument.trim(),
      deliveryAddress: deliveryAddress.trim(),
      paymentMethod,
      cardKind: paymentMethod === 'tarjeta' ? cardKind : undefined,
      items,
    });
  };

  const fieldClass =
    'w-full px-2 py-1.5 bg-[#0d1117] border border-gray-700 text-white text-[10px] font-mono focus:outline-none focus:border-[#00ece0]';

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full bg-[#16191b] border border-[#ff4655]/35 p-3 space-y-3"
    >
      <p className="text-[10px] font-mono uppercase tracking-widest text-[#ff4655]">
        Datos de facturacion
      </p>

      <div className="space-y-2 max-h-36 overflow-y-auto">
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex gap-2 p-2 bg-[#0d1117] border border-gray-800"
          >
            {item.image && (
              <img
                src={item.image}
                alt=""
                className="w-10 h-10 object-cover border border-gray-800 shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-white font-bold truncate">{item.productName}</p>
              <p className="text-[10px] text-[#00ece0] font-mono">
                {fmtCurrency(item.price)} x {item.quantity} ={' '}
                {fmtCurrency(item.price * item.quantity)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={item.quantity}
                  onChange={(e) => setQty(item.productId, Number(e.target.value) || 1)}
                  className="w-14 px-1 py-0.5 bg-[#16191b] border border-gray-700 text-white text-[10px] font-mono"
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  disabled={submitting}
                  className="text-[9px] font-mono uppercase text-red-400 hover:text-red-300"
                >
                  Quitar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {onAddMore && (
        <button
          type="button"
          onClick={onAddMore}
          disabled={submitting}
          className="w-full px-2 py-1.5 text-[9px] font-mono uppercase tracking-wider border border-dashed border-gray-600 text-gray-400 hover:border-[#00ece0] hover:text-[#00ece0]"
        >
          + Agregar otro producto
        </button>
      )}

      <div className="space-y-2">
        <div>
          <label className="block text-[9px] font-mono uppercase text-gray-500 mb-1">
            Nombre completo
          </label>
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className={fieldClass}
            placeholder="Tu nombre"
            disabled={submitting}
          />
        </div>
        <div>
          <label className="block text-[9px] font-mono uppercase text-gray-500 mb-1">
            Telefono
          </label>
          <input
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            className={fieldClass}
            placeholder="3001234567"
            disabled={submitting}
          />
        </div>
        <div>
          <label className="block text-[9px] font-mono uppercase text-gray-500 mb-1">
            Documento
          </label>
          <input
            value={contactDocument}
            onChange={(e) => setContactDocument(e.target.value)}
            className={fieldClass}
            placeholder="CC / NIT"
            disabled={submitting}
          />
        </div>
        <div>
          <label className="block text-[9px] font-mono uppercase text-gray-500 mb-1">
            Direccion de entrega
          </label>
          <textarea
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            className={`${fieldClass} min-h-[52px] resize-none`}
            placeholder="Calle, barrio, ciudad..."
            disabled={submitting}
            rows={2}
          />
        </div>
      </div>

      <div>
        <p className="text-[9px] font-mono uppercase text-gray-500 mb-1.5">Metodo de pago</p>
        <div className="grid grid-cols-2 gap-1.5">
          {PAYMENTS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              disabled={submitting}
              onClick={() => {
                setPaymentMethod(opt.id);
                setCardFlipped(false);
              }}
              className={`px-2 py-2 text-[10px] font-mono uppercase tracking-wider border transition-colors ${
                paymentMethod === opt.id
                  ? 'border-[#00ece0] bg-[#00ece0]/15 text-[#00ece0]'
                  : 'border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {paymentMethod === 'tarjeta' && (
        <div className="space-y-3 pt-1">
          <PaymentSimulationNotice />

          <div className="grid grid-cols-2 gap-1.5">
            {(
              [
                { id: 'credito' as const, label: 'Credito' },
                { id: 'debito' as const, label: 'Debito' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                disabled={submitting}
                onClick={() => setCardKind(opt.id)}
                className={`px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider border transition-colors ${
                  cardKind === opt.id
                    ? 'border-purple-400/60 bg-purple-500/20 text-purple-200'
                    : 'border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div>
            <p className="text-[9px] font-mono uppercase text-gray-500 mb-1.5">Banco / diseno</p>
            <div className="grid grid-cols-2 gap-1.5">
              {CARD_BANKS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setCardBank(b.id);
                    setCardFlipped(false);
                  }}
                  className={`px-1.5 py-2 text-[9px] font-mono uppercase tracking-wider border transition-colors ${
                    cardBank === b.id
                      ? 'border-white/40 text-white'
                      : 'border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                  style={
                    cardBank === b.id
                      ? { backgroundColor: `${b.accent}33`, borderColor: b.accent }
                      : undefined
                  }
                >
                  <span className="block truncate">{b.label}</span>
                  <span className="block text-[8px] opacity-60 normal-case tracking-normal">
                    {b.hint}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative rounded-lg bg-[#0a0a0c] p-3 border border-white/5 overflow-hidden">
            <ChatInteractiveCard
              data={card}
              cardKind={cardKind}
              bank={cardBank}
              flipped={cardFlipped}
            />
          </div>

          <div className="space-y-2">
            <div>
              <label className="block text-[9px] font-mono uppercase text-gray-500 mb-1">
                Numero de tarjeta
              </label>
              <input
                value={formatCardNumber(card.number)}
                onChange={(e) => {
                  setCardFlipped(false);
                  setCard((c) => ({ ...c, number: e.target.value.replace(/\D/g, '').slice(0, 16) }));
                }}
                onFocus={() => setCardFlipped(false)}
                className={fieldClass}
                placeholder="ACCT-000003"
                inputMode="numeric"
                autoComplete="cc-number"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-[9px] font-mono uppercase text-gray-500 mb-1">
                Titular
              </label>
              <input
                value={card.holder}
                onChange={(e) => {
                  setCardFlipped(false);
                  setCard((c) => ({ ...c, holder: e.target.value.slice(0, 26) }));
                }}
                onFocus={() => setCardFlipped(false)}
                className={fieldClass}
                placeholder="Como aparece en la tarjeta"
                autoComplete="cc-name"
                disabled={submitting}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-mono uppercase text-gray-500 mb-1">
                  Vence
                </label>
                <input
                  value={card.expiry}
                  onChange={(e) => {
                    setCardFlipped(false);
                    setCard((c) => ({ ...c, expiry: formatExpiry(e.target.value) }));
                  }}
                  onFocus={() => setCardFlipped(false)}
                  className={fieldClass}
                  placeholder="MM/YY"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-[9px] font-mono uppercase text-gray-500 mb-1">
                  CVV
                </label>
                <input
                  value={card.cvv}
                  onChange={(e) =>
                    setCard((c) => ({
                      ...c,
                      cvv: e.target.value.replace(/\D/g, '').slice(0, 4),
                    }))
                  }
                  onFocus={() => setCardFlipped(true)}
                  onBlur={() => setCardFlipped(false)}
                  className={fieldClass}
                  placeholder="123"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  disabled={submitting}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {localError && (
        <p className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-1.5">
          {localError}
        </p>
      )}

      <div className="flex gap-1.5">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-2 py-2 text-[9px] font-mono uppercase text-gray-500 border border-gray-700 hover:text-white"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || items.length === 0}
          className="flex-1 px-2 py-2 text-[10px] font-bold font-mono uppercase tracking-wider bg-[#00ece0] text-[#0f1923] hover:bg-[#00d4ce] disabled:opacity-50"
        >
          {submitting ? 'Procesando...' : `Confirmar · ${fmtCurrency(total)}`}
        </button>
      </div>
    </form>
  );
}

export function toCheckoutItem(product: ChatUiProduct, quantity: number): CheckoutCartItem {
  return {
    productId: product.id,
    productName: product.name,
    price: product.price,
    quantity,
    image: product.image,
  };
}

export default ChatCheckoutForm;
