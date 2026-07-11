import React, { useState, useEffect, useMemo } from 'react';
import { Search, Download, FileText, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { getAllInvoices, type InvoiceDto } from '../../api/invoiceApi';
import { downloadInvoicePdfClient } from '../../utils/invoicePdf';
import { StaffHeader } from '../../components/StaffHeader';

export const InvoicesPage = () => {
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    getAllInvoices()
      .then(setInvoices)
      .catch((err) => {
        console.error('Error cargando facturas:', err);
        setError('No se pudieron cargar las facturas.');
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredInvoices = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return invoices.filter(
      (invoice) =>
        invoice.invoiceNumber.toLowerCase().includes(q) ||
        invoice.customerName.toLowerCase().includes(q)
    );
  }, [invoices, searchTerm]);

  const handleDownload = (invoice: InvoiceDto) => {
    if (downloadingId != null) return;
    setDownloadingId(invoice.invoiceId);
    setError(null);
    try {
      downloadInvoicePdfClient(invoice);
    } catch (err) {
      console.error('Error generando PDF:', err);
      setError(`No se pudo generar el PDF de ${invoice.invoiceNumber}.`);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] p-6 font-mono">
      <StaffHeader
        title={
          <>
            Facturas <span className="text-[#00ece0]">//</span> Documentos
          </>
        }
        subtitle="Documentos de venta generados"
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
            <FileText className="w-4 h-4 text-[#00ece0]" />
            Lista de Facturas
          </h2>
          <div className="text-gray-500 text-xs">{filteredInvoices.length} facturas</div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por numero o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#0d1117] border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#00ece0] font-mono"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 uppercase tracking-wider border-b border-gray-800">
                <th className="text-left pb-3 font-mono">N FACTURA</th>
                <th className="text-left pb-3 font-mono">FECHA</th>
                <th className="text-left pb-3 font-mono">CLIENTE</th>
                <th className="text-center pb-3 font-mono">ITEMS</th>
                <th className="text-right pb-3 font-mono">TOTAL</th>
                <th className="text-center pb-3 font-mono">VENTA</th>
                <th className="text-center pb-3 font-mono">DETALLE</th>
                <th className="text-center pb-3 font-mono">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <React.Fragment key={invoice.invoiceId}>
                    <tr className="border-b border-gray-800/50 hover:bg-[#0d1117]/50 transition-colors">
                      <td className="py-3 font-mono text-[#00ece0]">{invoice.invoiceNumber}</td>
                      <td className="py-3 font-mono">
                        {new Date(invoice.issueDate).toLocaleDateString('es-CO')}
                      </td>
                      <td className="py-3 font-semibold">{invoice.customerName || '—'}</td>
                      <td className="py-3 text-center">{invoice.items?.length ?? 0}</td>
                      <td className="py-3 text-right font-mono">
                        ${Number(invoice.total).toLocaleString()}
                      </td>
                      <td className="py-3 text-center font-mono text-gray-400">#{invoice.saleId}</td>
                      <td className="py-3 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(
                              expandedId === invoice.invoiceId ? null : invoice.invoiceId
                            )
                          }
                          className="p-1.5 text-gray-500 hover:text-[#00ece0] transition-colors"
                          title="Ver detalle"
                        >
                          {expandedId === invoice.invoiceId ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 text-center">
                        <button
                          type="button"
                          disabled={downloadingId === invoice.invoiceId}
                          onClick={() => handleDownload(invoice)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-[#00ece0]/40 text-[#00ece0] hover:bg-[#00ece0]/10 disabled:opacity-50 transition-colors text-[10px] uppercase tracking-wider"
                          title="Descargar PDF"
                        >
                          {downloadingId === invoice.invoiceId ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          PDF
                        </button>
                      </td>
                    </tr>
                    {expandedId === invoice.invoiceId && (
                      <tr className="bg-[#0d1117]/80">
                        <td colSpan={8} className="px-4 py-3">
                          <div className="mb-2 text-[10px] text-gray-500 uppercase tracking-wider">
                            {invoice.paymentMethod ? `Pago: ${invoice.paymentMethod}` : 'Sin método de pago'}
                            {invoice.deliveryAddress ? ` · ${invoice.deliveryAddress}` : ''}
                          </div>
                          {(invoice.items?.length ?? 0) === 0 ? (
                            <p className="text-gray-500 text-xs">Sin ítems en esta factura.</p>
                          ) : (
                            <table className="w-full text-[11px]">
                              <thead>
                                <tr className="text-gray-600 uppercase tracking-wider border-b border-gray-800">
                                  <th className="text-left py-2 font-mono">Producto</th>
                                  <th className="text-center py-2 font-mono">Cant.</th>
                                  <th className="text-right py-2 font-mono">P. unit.</th>
                                  <th className="text-right py-2 font-mono">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody>
                                {invoice.items.map((item, idx) => (
                                  <tr key={`${invoice.invoiceId}-${idx}`} className="border-b border-gray-800/40">
                                    <td className="py-2 text-gray-200">{item.productName}</td>
                                    <td className="py-2 text-center font-mono">{item.quantity}</td>
                                    <td className="py-2 text-right font-mono">
                                      ${Number(item.unitPrice).toLocaleString()}
                                    </td>
                                    <td className="py-2 text-right font-mono text-[#00ece0]">
                                      ${Number(item.subtotal).toLocaleString()}
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredInvoices.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-sm">
            No se encontraron facturas que coincidan con la busqueda.
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicesPage;
