import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Search, Download, Lock, FileText, LogOut } from 'lucide-react';

interface Invoice {
  id: string;
  date: string;
  client: string;
  items: number;
  total: number;
  status: 'emitida' | 'pendiente';
}

const initialInvoices: Invoice[] = [
  { id: 'FAC-2025-001', date: '2025-01-15', client: 'Carlos Vega', items: 3, total: 3198, status: 'emitida' },
  { id: 'FAC-2025-002', date: '2025-01-15', client: 'María González', items: 1, total: 945, status: 'emitida' },
  { id: 'FAC-2025-003', date: '2025-01-14', client: 'Juan Pérez', items: 2, total: 1890, status: 'pendiente' },
  { id: 'FAC-2025-004', date: '2025-01-14', client: 'Ana López', items: 1, total: 699, status: 'emitida' },
  { id: 'FAC-2025-005', date: '2025-01-13', client: 'Pedro Sánchez', items: 4, total: 2598, status: 'pendiente' },
  { id: 'FAC-2025-006', date: '2025-01-13', client: 'Laura Martínez', items: 2, total: 1598, status: 'emitida' },
  { id: 'FAC-2025-007', date: '2025-01-12', client: 'Roberto Díaz', items: 1, total: 1299, status: 'emitida' },
];

export const InvoicesPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = user?.role === 'admin';
  const isReadOnly = user?.role === 'asesor';

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.client.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [invoices, searchTerm]);

  return (
    <div className="min-h-screen bg-[#0d1117] p-6 font-mono">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white uppercase tracking-wider">
              Facturas <span className="text-[#00ece0]">//</span> Documentos
            </h1>
            <p className="text-gray-500 text-xs mt-1 uppercase tracking-widest">
              Documentos de venta generados
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-[#16191b] border border-gray-800">
              <span className="text-gray-500 text-xs uppercase tracking-wider">Rol:</span>
              <span className={`ml-2 text-xs font-bold uppercase ${
                isAdmin ? 'text-[#ff4655]' : 'text-[#00ece0]'
              }`}>
                {user?.role === 'admin' ? 'Admin' : 'Asesor'}
              </span>
            </div>
            {isReadOnly && (
              <div className="px-3 py-1.5 bg-[#ff4655]/10 border border-[#ff4655]/30 flex items-center gap-2">
                <Lock className="w-3 h-3 text-[#ff4655]" />
                <span className="text-[#ff4655] text-xs font-bold uppercase tracking-wider">
                  Solo Lectura
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 text-[10px] font-mono uppercase tracking-wider transition-all rounded"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="bg-[#16191b] border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#00ece0]" />
            Lista de Facturas
          </h2>
          <div className="text-gray-500 text-xs">
            {filteredInvoices.length} facturas
          </div>
        </div>

        {/* Búsqueda */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por número o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#0d1117] border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#00ece0] font-mono"
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 uppercase tracking-wider border-b border-gray-800">
                <th className="text-left pb-3 font-mono">N° FACTURA</th>
                <th className="text-left pb-3 font-mono">FECHA</th>
                <th className="text-left pb-3 font-mono">CLIENTE</th>
                <th className="text-center pb-3 font-mono">ITEMS</th>
                <th className="text-right pb-3 font-mono">TOTAL</th>
                <th className="text-center pb-3 font-mono">ESTADO</th>
                <th className="text-center pb-3 font-mono">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-gray-800/50 hover:bg-[#0d1117]/50 transition-colors">
                  <td className="py-3 font-mono text-[#00ece0]">{invoice.id}</td>
                  <td className="py-3 font-mono">{invoice.date}</td>
                  <td className="py-3 font-semibold">{invoice.client}</td>
                  <td className="py-3 text-center">{invoice.items}</td>
                  <td className="py-3 text-right font-mono">${invoice.total.toLocaleString()}</td>
                  <td className="py-3 text-center">
                    <span
                      className={`px-2 py-1 text-[10px] font-bold uppercase ${
                        invoice.status === 'emitida'
                          ? 'bg-[#00ece0]/10 text-[#00ece0] border border-[#00ece0]/30'
                          : 'bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/30'
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <button
                      disabled={isReadOnly}
                      className={`p-1.5 transition-colors ${
                        isReadOnly
                          ? 'text-gray-600 cursor-not-allowed'
                          : 'text-gray-500 hover:text-[#00ece0]'
                      }`}
                      title={isReadOnly ? 'Acceso restringido' : 'Descargar'}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredInvoices.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-sm">
            No se encontraron facturas que coincidan con la búsqueda.
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicesPage;
