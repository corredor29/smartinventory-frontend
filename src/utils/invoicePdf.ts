import { jsPDF } from 'jspdf';
import type { InvoiceDto } from '../api/invoiceApi';

function money(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

/** Genera y descarga un PDF de factura en el navegador. */
export function downloadInvoicePdfClient(invoice: InvoiceDto) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(0, 120, 120);
  doc.text('SMARTINVENTORY', margin, y);

  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  doc.text(invoice.invoiceNumber || `FAC-${invoice.invoiceId}`, pageWidth - margin, y, {
    align: 'right',
  });

  y += 22;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text('Factura de venta', margin, y);
  doc.text(
    `Fecha: ${new Date(invoice.issueDate).toLocaleDateString('es-CO')}`,
    pageWidth - margin,
    y,
    { align: 'right' }
  );

  y += 16;
  doc.text(`Venta #${invoice.saleId}`, pageWidth - margin, y, { align: 'right' });

  y += 18;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 24;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('CLIENTE', margin, y);
  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text(invoice.customerName || 'Cliente', margin, y);
  y += 16;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  if (invoice.paymentMethod) {
    doc.text(`Metodo de pago: ${invoice.paymentMethod}`, margin, y);
    y += 12;
  }
  if (invoice.deliveryAddress) {
    const lines = doc.splitTextToSize(`Entrega: ${invoice.deliveryAddress}`, pageWidth - margin * 2);
    doc.text(lines, margin, y);
    y += 12 * lines.length;
  }
  if (invoice.contactPhone) {
    doc.text(`Telefono: ${invoice.contactPhone}`, margin, y);
    y += 12;
  }
  if (invoice.contactDocument) {
    doc.text(`Documento: ${invoice.contactDocument}`, margin, y);
    y += 12;
  }

  y += 16;
  const colProduct = margin;
  const colQty = pageWidth - margin - 220;
  const colUnit = pageWidth - margin - 130;
  const colSub = pageWidth - margin;

  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y - 12, pageWidth - margin * 2, 20, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text('Producto', colProduct + 4, y);
  doc.text('Cant.', colQty, y, { align: 'center' });
  doc.text('P. unitario', colUnit, y, { align: 'right' });
  doc.text('Subtotal', colSub, y, { align: 'right' });
  y += 18;

  doc.setFont('helvetica', 'normal');
  const items = invoice.items?.length ? invoice.items : [];
  for (const item of items) {
    if (y > 720) {
      doc.addPage();
      y = margin;
    }
    const nameLines = doc.splitTextToSize(item.productName || 'Producto', colQty - colProduct - 12);
    doc.setTextColor(30, 30, 30);
    doc.text(nameLines, colProduct + 4, y);
    doc.text(String(item.quantity), colQty, y, { align: 'center' });
    doc.text(money(Number(item.unitPrice)), colUnit, y, { align: 'right' });
    doc.text(money(Number(item.subtotal)), colSub, y, { align: 'right' });
    y += Math.max(16, nameLines.length * 12);
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y - 4, pageWidth - margin, y - 4);
  }

  if (items.length === 0) {
    doc.setTextColor(120, 120, 120);
    doc.text('Sin items detallados', margin + 4, y);
    y += 16;
  }

  y += 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text('TOTAL', pageWidth - margin - 130, y);
  doc.setTextColor(0, 120, 120);
  doc.text(money(Number(invoice.total)), colSub, y, { align: 'right' });

  y += 36;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text('Documento generado por SmartInventory.', margin, y);

  const filename = `${(invoice.invoiceNumber || `factura-${invoice.invoiceId}`).replace(/\//g, '-')}.pdf`;
  doc.save(filename);
}
