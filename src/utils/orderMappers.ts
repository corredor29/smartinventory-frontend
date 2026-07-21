import type { Order, OrderStatus, PaymentMethod } from '../types/order';
import type { SaleDto } from '../api/saleApi';
import type { InvoiceDto } from '../api/invoiceApi';
import { resolveProductImageUrl } from '../api/productApi';

const FALLBACK_IMAGE = '/placeholder-product.png';

function mapPaymentMethod(value: string | null | undefined): PaymentMethod {
  const normalized = (value || '').toLowerCase();
  if (normalized.includes('tarjeta') || normalized.includes('card')) return 'tarjeta';
  return 'efectivo';
}

function mapSaleStatus(statusName: string): OrderStatus {
  const normalized = statusName.toLowerCase();
  if (normalized.includes('cancel')) return 'cancelado';
  if (normalized.includes('entreg') || normalized.includes('complet')) return 'confirmado';
  if (normalized.includes('proceso') || normalized.includes('pendiente')) return 'en_proceso';
  return 'confirmado';
}

/** Mapea una venta del backend al modelo de UI de pedidos del cliente. */
export function mapSaleToOrder(sale: SaleDto, userId: string): Order {
  const items = sale.details.map((d) => ({
    productId: String(d.productId),
    productName: d.productName,
    category: d.categoryName || '—',
    image: resolveProductImageUrl(d.imageUrl) || FALLBACK_IMAGE,
    unitPrice: Number(d.unitPrice),
    quantity: d.quantity,
  }));

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const total = Number(sale.total);

  return {
    id: `ORD-${sale.saleId}`,
    invoiceId: sale.invoiceNumber || `FAC-${sale.saleId}`,
    userId,
    items,
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    tax: Math.max(0, total - subtotal),
    total,
    paymentMethod: mapPaymentMethod(sale.paymentMethod),
    status: mapSaleStatus(sale.statusName),
    createdAt: sale.saleDate,
    deliveryAddress: sale.deliveryAddress ?? null,
    deliveryLat: sale.deliveryLat ?? null,
    deliveryLng: sale.deliveryLng ?? null,
    contactPhone: sale.contactPhone ?? null,
    contactDocument: sale.contactDocument ?? null,
  };
}

/** Mapea una factura del backend al modelo de UI (vista facturas del cliente). */
export function mapInvoiceToOrder(invoice: InvoiceDto, userId: string): Order {
  const items = invoice.items.map((item, index) => ({
    productId: `inv-${invoice.invoiceId}-${index}`,
    productName: item.productName,
    category: item.categoryName?.trim() || '—',
    image: resolveProductImageUrl(item.imageUrl) || FALLBACK_IMAGE,
    unitPrice: Number(item.unitPrice),
    quantity: item.quantity,
  }));

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const total = Number(invoice.total);

  return {
    id: `ORD-${invoice.saleId}`,
    invoiceId: invoice.invoiceNumber,
    userId,
    items,
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    tax: Math.max(0, total - subtotal),
    total,
    paymentMethod: 'efectivo',
    status: 'confirmado',
    createdAt: invoice.issueDate,
  };
}
