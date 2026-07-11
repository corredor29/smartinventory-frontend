import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, Package, History, SlidersHorizontal, X } from 'lucide-react';
import { getAllInventory, adjustStock, type InventoryDto } from '../../api/inventoryApi';
import {
  getMovementsByInventoryId,
  type InventoryMovementDto,
} from '../../api/inventoryMovementApi';
import { AdjustStockModal } from '../../components/AdjustStockModal';
import { StaffHeader } from '../../components/StaffHeader';

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleString('es-CO', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return value;
  }
}

export const InventoryPage = () => {
  const { user } = useAuth();

  const [items, setItems] = useState<InventoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [adjustTarget, setAdjustTarget] = useState<InventoryDto | null>(null);
  const [historyTarget, setHistoryTarget] = useState<InventoryDto | null>(null);
  const [history, setHistory] = useState<InventoryMovementDto[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const userRoleLower = user?.role?.toLowerCase();
  const isReadOnly = userRoleLower === 'asesor' || userRoleLower === 'operator';

  useEffect(() => {
    getAllInventory()
      .then(setItems)
      .catch((err) => {
        console.error('Error cargando inventario:', err);
        setError('No se pudo cargar el inventario.');
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.productName.toLowerCase().includes(q) ||
        String(item.productId).includes(q) ||
        String(item.inventoryId).includes(q),
    );
  }, [items, searchTerm]);

  const openHistory = async (item: InventoryDto) => {
    setHistoryTarget(item);
    setHistory([]);
    setHistoryLoading(true);
    try {
      const data = await getMovementsByInventoryId(item.inventoryId);
      setHistory(data);
    } catch (err) {
      console.error('Error cargando historial:', err);
      setError('No se pudo cargar el historial del producto.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAdjustConfirm = async (quantityChange: number, reason: string) => {
    if (!adjustTarget) return;
    const updated = await adjustStock(adjustTarget.productId, quantityChange, reason);
    setItems((prev) =>
      prev.map((item) => (item.productId === adjustTarget.productId ? updated : item)),
    );
  };

  return (
    <div className="min-h-screen bg-[#0d1117] p-6 font-mono">
      <StaffHeader
        title={
          <>
            Inventario <span className="text-[#00ece0]">//</span> Stock
          </>
        }
        subtitle="Control de existencias"
        showReadOnly
      >
        {error && (
          <div className="mt-2 px-3 py-2 bg-[#ff4655]/10 border border-[#ff4655]/30 text-[#ff4655] text-xs">
            {error}
          </div>
        )}
      </StaffHeader>

      <div className="bg-[#16191b] border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <Package className="w-4 h-4 text-[#00ece0]" />
            Existencias
          </h2>
          <div className="text-gray-500 text-xs">{filtered.length} registros</div>
        </div>

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por producto o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0d1117] border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#00ece0] font-mono"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 uppercase tracking-wider border-b border-gray-800">
                <th className="text-left pb-3 font-mono">Inv ID</th>
                <th className="text-left pb-3 font-mono">Producto</th>
                <th className="text-left pb-3 font-mono">Product ID</th>
                <th className="text-right pb-3 font-mono">Stock</th>
                <th className="text-center pb-3 font-mono">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.inventoryId}
                    className="border-b border-gray-800/50 hover:bg-[#0d1117]/50 transition-colors"
                  >
                    <td className="py-3 font-mono text-[#00ece0]">{item.inventoryId}</td>
                    <td className="py-3 font-semibold">{item.productName}</td>
                    <td className="py-3 font-mono">{item.productId}</td>
                    <td className="py-3 text-right font-mono">
                      <span className={item.currentStock <= 5 ? 'text-[#ff4655]' : 'text-white'}>
                        {item.currentStock}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openHistory(item)}
                          className="inline-flex items-center gap-1 px-2 py-1.5 text-gray-400 hover:text-[#00ece0] border border-gray-800 hover:border-[#00ece0]/40 transition-colors"
                          title="Ver historial"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span className="uppercase tracking-wider text-[10px]">Historial</span>
                        </button>
                        <button
                          onClick={() => !isReadOnly && setAdjustTarget(item)}
                          disabled={isReadOnly}
                          className={`inline-flex items-center gap-1 px-2 py-1.5 border transition-colors ${
                            isReadOnly
                              ? 'text-gray-600 border-gray-800 cursor-not-allowed'
                              : 'text-gray-400 hover:text-[#00ece0] border-gray-800 hover:border-[#00ece0]/40'
                          }`}
                          title={isReadOnly ? 'Acceso restringido' : 'Ajustar stock'}
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span className="uppercase tracking-wider text-[10px]">Ajustar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-sm">
            No se encontraron registros de inventario.
          </div>
        )}
      </div>

      {adjustTarget && (
        <AdjustStockModal
          productId={adjustTarget.productId}
          productName={adjustTarget.productName}
          currentStock={adjustTarget.currentStock}
          onClose={() => setAdjustTarget(null)}
          onConfirm={handleAdjustConfirm}
        />
      )}

      {historyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl bg-[#16191b] border border-gray-800 p-6 font-mono max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-white text-sm font-bold uppercase tracking-wider">
                  Historial de movimientos
                </h3>
                <p className="text-gray-500 text-[10px] mt-1 uppercase tracking-widest">
                  {historyTarget.productName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryTarget(null)}
                className="text-gray-500 hover:text-white transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {historyLoading ? (
                <p className="text-gray-500 text-xs py-8 text-center">Cargando...</p>
              ) : history.length === 0 ? (
                <p className="text-gray-500 text-xs py-8 text-center">
                  Sin movimientos registrados.
                </p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-500 uppercase tracking-wider border-b border-gray-800">
                      <th className="text-left pb-2">Fecha</th>
                      <th className="text-left pb-2">Tipo</th>
                      <th className="text-right pb-2">Cant.</th>
                      <th className="text-left pb-2">Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    {history.map((m) => (
                      <tr key={m.movementId} className="border-b border-gray-800/40">
                        <td className="py-2 font-mono text-[10px]">{formatDate(m.createdAt)}</td>
                        <td className="py-2">
                          <span
                            className={
                              m.movementTypeName.toLowerCase().includes('entrada')
                                ? 'text-[#00ece0]'
                                : m.movementTypeName.toLowerCase().includes('salida')
                                  ? 'text-[#ff4655]'
                                  : 'text-amber-400'
                            }
                          >
                            {m.movementTypeName || '—'}
                          </span>
                        </td>
                        <td className="py-2 text-right font-mono">{m.quantity}</td>
                        <td className="py-2 text-gray-400 break-words">{m.reason || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
