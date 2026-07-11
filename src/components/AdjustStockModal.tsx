import { useState } from 'react';
import { X } from 'lucide-react';

export type AdjustStockModalProps = {
  productId: number;
  productName: string;
  currentStock: number;
  onClose: () => void;
  onConfirm: (quantityChange: number, reason: string) => Promise<void>;
};

export function AdjustStockModal({
  productName,
  currentStock,
  onClose,
  onConfirm,
}: AdjustStockModalProps) {
  const [direction, setDirection] = useState<'entrada' | 'salida'>('entrada');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError('La cantidad debe ser mayor a 0.');
      return;
    }
    if (!reason.trim()) {
      setError('El motivo es obligatorio.');
      return;
    }
    if (direction === 'salida' && quantity > currentStock) {
      setError(`Stock insuficiente (disponible: ${currentStock}).`);
      return;
    }

    setSubmitting(true);
    try {
      const change = direction === 'entrada' ? quantity : -quantity;
      await onConfirm(change, reason.trim());
      onClose();
    } catch (err) {
      console.error(err);
      setError('No se pudo ajustar el stock.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md bg-[#16191b] border border-gray-800 p-6 font-mono">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-white text-sm font-bold uppercase tracking-wider">
              Ajustar Stock
            </h3>
            <p className="text-gray-500 text-[10px] mt-1 uppercase tracking-widest">
              {productName} · Actual: {currentStock}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-2">
              Tipo
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDirection('entrada')}
                className={`px-3 py-2 text-xs uppercase tracking-wider border transition-colors ${
                  direction === 'entrada'
                    ? 'border-[#00ece0] text-[#00ece0] bg-[#00ece0]/10'
                    : 'border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                Entrada
              </button>
              <button
                type="button"
                onClick={() => setDirection('salida')}
                className={`px-3 py-2 text-xs uppercase tracking-wider border transition-colors ${
                  direction === 'salida'
                    ? 'border-[#ff4655] text-[#ff4655] bg-[#ff4655]/10'
                    : 'border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                Salida
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-2">
              Cantidad
            </label>
            <input
              type="number"
              min={1}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-3 py-2 bg-[#0d1117] border border-gray-700 text-white text-sm focus:outline-none focus:border-[#00ece0]"
            />
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-2">
              Motivo
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={255}
              placeholder="Ej. Reposición de proveedor, merma, corrección..."
              className="w-full px-3 py-2 bg-[#0d1117] border border-gray-700 text-white text-sm focus:outline-none focus:border-[#00ece0] resize-none"
            />
          </div>

          {error && (
            <div className="px-3 py-2 bg-[#ff4655]/10 border border-[#ff4655]/30 text-[#ff4655] text-xs">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-3 py-2 border border-gray-700 text-gray-400 text-xs uppercase tracking-wider hover:border-gray-500 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-3 py-2 bg-[#00ece0] text-[#0d1117] text-xs font-bold uppercase tracking-wider hover:bg-[#00d4ce] transition-colors disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
