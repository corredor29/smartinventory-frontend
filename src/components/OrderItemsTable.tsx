import type { OrderLineItem } from '../types/order';
import { fmtCurrency } from '../utils/currency';

interface OrderItemsTableProps {
  items: OrderLineItem[];
  totalItems: number;
  subtotal: number;
  tax: number;
  total: number;
}

export function OrderItemsTable({ items, totalItems, subtotal, tax, total }: OrderItemsTableProps) {
  return (
    <>
      <div className="space-y-3 mb-4">
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest pb-2 border-b border-gray-800/60">
          <span>Producto</span>
          <span className="text-center w-12">Cant.</span>
          <span className="text-right w-24">Subtotal</span>
        </div>

        {items.map((item) => (
          <div
            key={item.productId}
            className="grid grid-cols-[1fr_auto_auto] gap-4 items-center py-2 border-b border-gray-800/40 last:border-0"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-[#0f1923]/60 border border-gray-800/50 flex items-center justify-center shrink-0">
                <img
                  src={item.image}
                  alt={item.productName}
                  className="max-w-full max-h-full object-contain p-0.5"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="min-w-0">
                <div className="text-sm text-white truncate">{item.productName}</div>
                <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                  {item.category}
                </div>
              </div>
            </div>
            <span className="text-sm font-mono text-gray-400 text-center w-12">{item.quantity}</span>
            <span className="text-sm font-mono text-[#00ece0] text-right w-24">
              {fmtCurrency(item.unitPrice * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-[#0f1923]/50 border border-gray-800/60 p-4 space-y-2">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-gray-500 uppercase tracking-wider">Subtotal ({totalItems} uds)</span>
          <span className="text-white">{fmtCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-xs font-mono">
          <span className="text-gray-500 uppercase tracking-wider">Impuestos</span>
          <span className="text-white">{fmtCurrency(tax)}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-gray-800">
          <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">Total</span>
          <span className="text-xl font-black text-white font-mono">{fmtCurrency(total)}</span>
        </div>
      </div>
    </>
  );
}
