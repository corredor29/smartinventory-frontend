import { useEffect, useMemo, useState } from 'react';
import { History, Search } from 'lucide-react';
import {
  getAllMovements,
  type InventoryMovementDto,
} from '../../api/inventoryMovementApi';
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

function typeClass(typeName: string): string {
  const n = typeName.toLowerCase();
  if (n.includes('entrada')) return 'text-[#00ece0]';
  if (n.includes('salida')) return 'text-[#ff4655]';
  return 'text-amber-400';
}

export const MovementsPage = () => {
  const [movements, setMovements] = useState<InventoryMovementDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    getAllMovements()
      .then((data) => {
        const sorted = [...data].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setMovements(sorted);
      })
      .catch((err) => {
        console.error('Error cargando movimientos:', err);
        setError('No se pudieron cargar los movimientos.');
      })
      .finally(() => setLoading(false));
  }, []);

  const typeOptions = useMemo(() => {
    const set = new Set(
      movements.map((m) => m.movementTypeName).filter((n) => n && n.trim().length > 0),
    );
    return Array.from(set).sort();
  }, [movements]);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return movements.filter((m) => {
      const matchesSearch =
        m.productName.toLowerCase().includes(q) ||
        (m.reason || '').toLowerCase().includes(q) ||
        String(m.inventoryId).includes(q) ||
        String(m.movementId).includes(q);

      const matchesType =
        typeFilter === 'all' ||
        m.movementTypeName.toLowerCase() === typeFilter.toLowerCase();

      return matchesSearch && matchesType;
    });
  }, [movements, searchTerm, typeFilter]);

  return (
    <div className="min-h-screen bg-[#0d1117] p-6 font-mono">
      <StaffHeader
        title={
          <>
            Movimientos <span className="text-[#00ece0]">//</span> Kardex
          </>
        }
        subtitle="Historial de entradas y salidas"
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
            <History className="w-4 h-4 text-[#00ece0]" />
            Registro de movimientos
          </h2>
          <div className="text-gray-500 text-xs">{filtered.length} registros</div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por producto, motivo o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#0d1117] border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#00ece0] font-mono"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 bg-[#0d1117] border border-gray-700 text-white text-sm focus:outline-none focus:border-[#00ece0] font-mono"
          >
            <option value="all">Todos los tipos</option>
            {typeOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 uppercase tracking-wider border-b border-gray-800">
                <th className="text-left pb-3 font-mono">Fecha</th>
                <th className="text-left pb-3 font-mono">Producto</th>
                <th className="text-left pb-3 font-mono">Tipo</th>
                <th className="text-right pb-3 font-mono">Cantidad</th>
                <th className="text-left pb-3 font-mono">Motivo</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No se encontraron movimientos.
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr
                    key={m.movementId}
                    className="border-b border-gray-800/50 hover:bg-[#0d1117]/50 transition-colors"
                  >
                    <td className="py-3 font-mono text-[10px] text-gray-400">
                      {formatDate(m.createdAt)}
                    </td>
                    <td className="py-3 font-semibold">{m.productName || `Inv #${m.inventoryId}`}</td>
                    <td className={`py-3 ${typeClass(m.movementTypeName)}`}>
                      {m.movementTypeName || '—'}
                    </td>
                    <td className="py-3 text-right font-mono">{m.quantity}</td>
                    <td className="py-3 text-gray-400 break-words max-w-xs">
                      {m.reason || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MovementsPage;
