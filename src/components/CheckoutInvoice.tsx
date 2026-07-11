import { useState } from 'react';
import type { CartItem } from '../context/CartContext';
import type { PaymentMethod } from '../types/order';
import { fmtCurrency } from '../utils/currency';
import { AddressPicker, type DeliveryLocation } from './AddressPicker';
import {
  CARD_BANKS,
  ChatInteractiveCard,
  formatCardNumber,
  formatExpiry,
  PaymentSimulationNotice,
  type CardBank,
  type CardFormData,
  type CardKind,
} from './chat/ChatInteractiveCard';

export type { PaymentMethod, CardKind, CardBank };

const CLIP_BTN = 'polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)';

interface CheckoutInvoiceProps {
  invoiceId: string;
  items: CartItem[];
  totalItems: number;
  paymentMethod: PaymentMethod | null;
  onPaymentChange: (method: PaymentMethod) => void;
  cardKind: CardKind;
  onCardKindChange: (kind: CardKind) => void;
  delivery: DeliveryLocation | null;
  onDeliveryChange: (value: DeliveryLocation) => void;
  contactPhone: string;
  onContactPhoneChange: (value: string) => void;
  contactDocument: string;
  onContactDocumentChange: (value: string) => void;
  onBack: () => void;
  onFinalize: () => void;
  isProcessing: boolean;
  error?: string | null;
}

const paymentOptions: { id: PaymentMethod; label: string; desc: string; icon: string }[] = [
  { id: 'efectivo', label: 'Efectivo', desc: 'Pago en punto de entrega o tienda fisica', icon: '💵' },
  { id: 'tarjeta', label: 'Tarjeta', desc: 'Debito o credito - procesamiento inmediato', icon: '💳' },
];

export function CheckoutInvoice({
  invoiceId,
  items,
  totalItems,
  paymentMethod,
  onPaymentChange,
  cardKind,
  onCardKindChange,
  delivery,
  onDeliveryChange,
  contactPhone,
  onContactPhoneChange,
  contactDocument,
  onContactDocumentChange,
  onBack,
  onFinalize,
  isProcessing,
  error = null,
}: CheckoutInvoiceProps) {
  const [card, setCard] = useState<CardFormData>({
    number: '',
    holder: '',
    expiry: '',
    cvv: '',
  });
  const [cardBank, setCardBank] = useState<CardBank>('nu');
  const [cardFlipped, setCardFlipped] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = 0;
  const total = subtotal + tax;

  const validateCard = () => {
    const digits = card.number.replace(/\D/g, '');
    if (digits.length < 15) return 'Numero de tarjeta incompleto.';
    if (!card.holder.trim()) return 'Ingresa el nombre del titular.';
    if (!/^\d{2}\/\d{2}$/.test(card.expiry)) return 'Fecha invalida (MM/YY).';
    if (card.cvv.replace(/\D/g, '').length < 3) return 'CVV incompleto.';
    return null;
  };

  const handleFinalizeClick = () => {
    if (paymentMethod === 'tarjeta') {
      const err = validateCard();
      if (err) {
        setCardError(err);
        return;
      }
    }
    setCardError(null);
    onFinalize();
  };

  const canFinalize =
    !!paymentMethod &&
    !!delivery?.address &&
    !!contactPhone.trim() &&
    !!contactDocument.trim() &&
    !isProcessing;

  const missingDeliveryContact =
    !delivery?.address || !contactPhone.trim() || !contactDocument.trim();

  const fieldClass =
    'w-full bg-[#0d1117] border border-gray-700 text-white text-sm font-mono px-3 py-2.5 outline-none focus:border-[#00ece0] transition-colors disabled:opacity-40';

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
          Paso 2 de 2 - Pago
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
              <h2 className="text-xl font-black text-white uppercase tracking-tight mt-1">Resumen de facturacion</h2>
              <p className="text-gray-500 text-xs font-mono mt-1">
                Revisa tu pedido antes de seleccionar el metodo de pago
              </p>
            </div>
            <div className="text-left sm:text-right shrink-0">
              <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">N de referencia</div>
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

          <div className="mb-8">
            <div className="mb-3">
              <span className="text-[10px] font-mono text-[#00ece0] uppercase tracking-[0.3em]">Datos de entrega</span>
              <p className="text-xs text-gray-500 mt-1">Indica direccion y datos de contacto *</p>
            </div>

            <AddressPicker
              value={delivery}
              onChange={onDeliveryChange}
              disabled={isProcessing}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div>
                <label className="block text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-1.5">
                  Telefono
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => onContactPhoneChange(e.target.value)}
                  disabled={isProcessing}
                  placeholder="Ej. 3001234567"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="block text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-1.5">
                  Documento
                </label>
                <input
                  type="text"
                  value={contactDocument}
                  onChange={(e) => onContactDocumentChange(e.target.value)}
                  disabled={isProcessing}
                  placeholder="CC / NIT"
                  className={fieldClass}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="mb-3">
              <span className="text-[10px] font-mono text-[#ff4655] uppercase tracking-[0.3em]">Metodo de pago</span>
              <p className="text-xs text-gray-500 mt-1">Selecciona una opcion para continuar *</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Metodo de pago">
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
                      onChange={() => {
                        onPaymentChange(option.id);
                        setCardFlipped(false);
                        setCardError(null);
                      }}
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

            {paymentMethod === 'tarjeta' && (
              <div className="mt-5 space-y-4">
                <PaymentSimulationNotice />

                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'credito' as const, label: 'Credito' },
                      { id: 'debito' as const, label: 'Debito' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isProcessing}
                      onClick={() => onCardKindChange(opt.id)}
                      className={`px-3 py-2.5 text-xs font-mono uppercase tracking-wider border transition-colors ${
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
                  <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-2">
                    Banco / diseno de tarjeta
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CARD_BANKS.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        disabled={isProcessing}
                        onClick={() => {
                          setCardBank(b.id);
                          setCardFlipped(false);
                        }}
                        className={`px-2 py-2.5 text-[10px] font-mono uppercase tracking-wider border transition-colors ${
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
                        <span className="block text-[8px] opacity-60 normal-case tracking-normal mt-0.5">
                          {b.hint}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative rounded-xl bg-[#0a0a0c] p-4 sm:p-5 border border-white/5 overflow-hidden max-w-md mx-auto">
                  <ChatInteractiveCard
                    data={card}
                    cardKind={cardKind}
                    bank={cardBank}
                    flipped={cardFlipped}
                  />
                </div>

                <div className="space-y-3 max-w-md mx-auto">
                  <div>
                    <label className="block text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-1.5">
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
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-1.5">
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
                      disabled={isProcessing}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-1.5">
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
                        disabled={isProcessing}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-1.5">
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
                        disabled={isProcessing}
                      />
                    </div>
                  </div>
                </div>

                {cardError && (
                  <div className="text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2">
                    {cardError}
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="mt-6 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2">
              {error}
            </div>
          )}

          <button
            onClick={handleFinalizeClick}
            disabled={!canFinalize}
            className="w-full mt-8 py-3.5 bg-[#ff4655] hover:bg-[#e63e4c] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold uppercase tracking-widest transition-colors"
            style={{ clipPath: CLIP_BTN }}
          >
            {isProcessing ? 'Procesando compra...' : 'Finalizar compra'}
          </button>

          {!paymentMethod && (
            <p className="text-[10px] text-gray-600 font-mono text-center mt-3 uppercase tracking-wider">
              Debes seleccionar un metodo de pago para continuar
            </p>
          )}
          {paymentMethod && missingDeliveryContact && (
            <p className="text-[10px] text-gray-600 font-mono text-center mt-3 uppercase tracking-wider">
              Completa direccion, telefono y documento para continuar
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
