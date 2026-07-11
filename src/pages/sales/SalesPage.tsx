import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react';
import { getAllSales, changeSaleStatus, type SaleDto } from '../../api/saleApi';
import { getSaleStatuses, type SaleStatusDto } from '../../api/saleStatusApi';
import { StaffHeader } from '../../components/StaffHeader';

function statusBadgeClass(statusName: string): string {
  const n = statusName.toLowerCase();
  if (n.includes('cancel')) {
    return 'bg-[#ff4655]/10 text-[#ff4655] border-[#ff4655]/30';
  }
  if (n.includes('pendiente')) {
    return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  }
  if (n.includes('complet')) {
    return 'bg-[#00ece0]/10 text-[#00ece0] border-[#00ece0]/30';
  }
  return 'bg-gray-700/40 text-gray-300 border-gray-600';
}

export const SalesPage = () => {
  const { user } = useAuth();

  const [sales, setSales] = useState<SaleDto[]>([]);
  const [statuses, setStatuses] = useState<SaleStatusDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [originFilter, setOriginFilter] = useState<'all' | 'manual' | 'chatbot'>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const userRoleLower = user?.role?.toLowerCase();
  const isAdmin = userRoleLower === 'admin';
  // Admin y Asesor pueden cambiar estado (coincide con el backend).
  const canChangeStatus = isAdmin || userRoleLower === 'asesor' || userRoleLower === 'operator';

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [salesData, statusesData] = await Promise.all([getAllSales(), getSaleStatuses()]);
      setSales(salesData);
      setStatuses(statusesData);
    } catch (err) {
      console.error('Error cargando ventas:', err);
      setError('No se pudieron cargar las ventas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return sales.filter((sale) => {
      const matchesSearch =
        sale.customerName.toLowerCase().includes(q) ||
        String(sale.saleId).includes(q) ||
        sale.originName.toLowerCase().includes(q) ||
        sale.statusName.toLowerCase().includes(q) ||
        (sale.invoiceNumber || '').toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'all' ||
        sale.statusName.toLowerCase() === statusFilter.toLowerCase();

      const origin = sale.originName.toLowerCase();
      const matchesOrigin =
        originFilter === 'all' ||
        (originFilter === 'chatbot' && origin.includes('chatbot')) ||
        (originFilter === 'manual' && !origin.includes('chatbot'));

      return matchesSearch && matchesStatus && matchesOrigin;
    });
  }, [sales, searchTerm, statusFilter, originFilter]);

  const resolveStatusId = (statusName: string): number | undefined => {
    return statuses.find(
      (s) => s.name.toLowerCase() === statusName.toLowerCase(),
    )?.saleStatusId;
  };

  const handleStatusChange = async (sale: SaleDto, nextStatusId: number) => {
    if (!canChangeStatus || updatingId !== null) return;

    const currentId = resolveStatusId(sale.statusName);
    if (currentId === nextStatusId) return;

    const nextName = statuses.find((s) => s.saleStatusId === nextStatusId)?.name ?? 'este estado';
    if (!window.confirm(`¿Cambiar la venta #${sale.saleId} a "${nextName}"?`)) {
      return;
    }

    setUpdatingId(sale.saleId);
    setError(null);
    try {
      const updated = await changeSaleStatus(sale.saleId, nextStatusId);
      setSales((prev) => prev.map((s) => (s.saleId === sale.saleId ? updated : s)));
    } catch (err: unknown) {
      console.error('Error cambiando estado:', err);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'No se pudo cambiar el estado de la venta.';
      setError(message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] p-6 font-mono">
      <StaffHeader
        title={
          <>
            Ventas <span className="text-[#00ece0]">//</span> Historial
          </>
        }
        subtitle="Registro y estados de operaciones"
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
            <ShoppingCart className="w-4 h-4 text-[#00ece0]" />
            Lista de Ventas
          </h2>
          <div className="text-gray-500 text-xs">{filtered.length} ventas</div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por cliente, ID, factura, origen o estado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#0d1117] border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#00ece0] font-mono"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-[#0d1117] border border-gray-700 text-white text-sm focus:outline-none focus:border-[#00ece0] font-mono"
          >
            <option value="all">Todos los estados</option>
            {statuses.map((s) => (
              <option key={s.saleStatusId} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value as 'all' | 'manual' | 'chatbot')}
            className="px-4 py-2 bg-[#0d1117] border border-gray-700 text-white text-sm focus:outline-none focus:border-[#00ece0] font-mono"
          >
            <option value="all">Todos los origenes</option>
            <option value="manual">Manual</option>
            <option value="chatbot">Chatbot</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 uppercase tracking-wider border-b border-gray-800">
                <th className="text-left pb-3 font-mono">ID</th>
                <th className="text-left pb-3 font-mono">Cliente</th>
                <th className="text-left pb-3 font-mono">Origen</th>
                <th className="text-left pb-3 font-mono">Fecha</th>
                <th className="text-right pb-3 font-mono">Total</th>
                <th className="text-center pb-3 font-mono">Estado</th>
                <th className="text-center pb-3 font-mono">Detalle</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : (
                filtered.map((sale) => {
                  const currentStatusId = resolveStatusId(sale.statusName);
                  const isUpdating = updatingId === sale.saleId;

                  return (
                    <React.Fragment key={sale.saleId}>
                      <tr className="border-b border-gray-800/50 hover:bg-[#0d1117]/50 transition-colors">
                        <td className="py-3 font-mono text-[#00ece0]">{sale.saleId}</td>
                        <td className="py-3 font-semibold">{sale.customerName || '—'}</td>
                        <td className="py-3">
                          <span className="px-2 py-1 bg-[#0d1117] border border-gray-700 text-[10px] uppercase">
                            {sale.originName}
                          </span>
                        </td>
                        <td className="py-3 font-mono">
                          {new Date(sale.saleDate).toLocaleDateString('es-CO')}
                        </td>
                        <td className="py-3 text-right font-mono">
                          ${Number(sale.total).toLocaleString()}
                        </td>
                        <td className="py-3 text-center">
                          {canChangeStatus && statuses.length > 0 ? (
                            <div className="inline-flex flex-col items-center gap-1">
                              <select
                                value={currentStatusId ?? ''}
                                disabled={isUpdating}
                                onChange={(e) =>
                                  handleStatusChange(sale, Number(e.target.value))
                                }
                                className={`px-2 py-1 text-[10px] font-bold uppercase border bg-[#0d1117] focus:outline-none focus:border-[#00ece0] disabled:opacity-50 ${statusBadgeClass(sale.statusName)}`}
                              >
                                {statuses.map((s) => (
                                  <option key={s.saleStatusId} value={s.saleStatusId}>
                                    {s.name}
                                  </option>
                                ))}
                              </select>
                              {isUpdating && (
                                <span className="text-[9px] text-gray-500">Actualizando...</span>
                              )}
                            </div>
                          ) : (
                            <span
                              className={`px-2 py-1 text-[10px] font-bold uppercase border ${statusBadgeClass(sale.statusName)}`}
                            >
                              {sale.statusName}
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() =>
                              setExpandedId(expandedId === sale.saleId ? null : sale.saleId)
                            }
                            className="p-1.5 text-gray-500 hover:text-[#00ece0] transition-colors"
                          >
                            {expandedId === sale.saleId ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                      {expandedId === sale.saleId && (
                        <tr className="bg-[#0d1117]/80">
                          <td colSpan={7} className="px-4 py-3">
                            <div className="mb-2 text-[10px] text-gray-500 uppercase tracking-wider">
                              {sale.invoiceNumber
                                ? `Factura: ${sale.invoiceNumber}`
                                : 'Sin factura'}
                              {sale.paymentMethod ? ` · Pago: ${sale.paymentMethod}` : ''}
                            </div>
                            {(sale.deliveryAddress || sale.contactPhone || sale.contactDocument) && (
                              <div className="mb-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
                                {sale.deliveryAddress && (
                                  <div className="sm:col-span-3 bg-[#0f1923]/50 border border-gray-800/60 p-2">
                                    <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-0.5">
                                      Dirección
                                    </div>
                                    <div className="text-gray-200 break-words normal-case">
                                      {sale.deliveryAddress}
                                    </div>
                                  </div>
                                )}
                                {sale.contactPhone && (
                                  <div className="bg-[#0f1923]/50 border border-gray-800/60 p-2">
                                    <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-0.5">
                                      Teléfono
                                    </div>
                                    <div className="text-gray-200 font-mono normal-case">
                                      {sale.contactPhone}
                                    </div>
                                  </div>
                                )}
                                {sale.contactDocument && (
                                  <div className="bg-[#0f1923]/50 border border-gray-800/60 p-2">
                                    <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-0.5">
                                      Documento
                                    </div>
                                    <div className="text-gray-200 font-mono normal-case">
                                      {sale.contactDocument}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            {sale.details.length === 0 ? (
                              <p className="text-gray-500 text-[10px]">Sin detalle de ítems</p>
                            ) : (
                              <table className="w-full text-[10px]">
                                <thead>
                                  <tr className="text-gray-600 uppercase">
                                    <th className="text-left pb-2">Producto</th>
                                    <th className="text-right pb-2">Cant.</th>
                                    <th className="text-right pb-2">P. Unit.</th>
                                    <th className="text-right pb-2">Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {sale.details.map((d) => (
                                    <tr
                                      key={d.saleDetailId}
                                      className="border-t border-gray-800/40"
                                    >
                                      <td className="py-1.5">{d.productName}</td>
                                      <td className="py-1.5 text-right font-mono">{d.quantity}</td>
                                      <td className="py-1.5 text-right font-mono">
                                        ${Number(d.unitPrice).toLocaleString()}
                                      </td>
                                      <td className="py-1.5 text-right font-mono">
                                        ${Number(d.subtotal).toLocaleString()}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-sm">
            No se encontraron ventas que coincidan con la búsqueda.
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesPage;
