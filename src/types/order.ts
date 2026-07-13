export type PaymentMethod = 'efectivo' | 'tarjeta';

export type OrderStatus = 'confirmado' | 'en_proceso' | 'entregado' | 'cancelado';

export interface OrderLineItem {
  productId: string;
  productName: string;
  category: string;
  image: string;
  unitPrice: number;
  quantity: number;
}

export interface Order {
  id: string;
  invoiceId: string;
  userId: string;
  items: OrderLineItem[];
  totalItems: number;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  createdAt: string;
  deliveryAddress?: string | null;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  contactPhone?: string | null;
  contactDocument?: string | null;
}

/**
 * ==============================================================
 * ARCHIVO: order.ts
 * UBICACIÓN: src/types/order.ts
 * ==============================================================
 *
 * PROPÓSITO
 *
 * Este archivo define todos los tipos e interfaces utilizados
 * para representar una orden de compra dentro del sistema
 * SmartInventory.
 *
 * Las interfaces aquí definidas permiten que TypeScript valide
 * automáticamente la estructura de los pedidos utilizados en
 * toda la aplicación.
 *
 * Gracias a ello se reduce la posibilidad de errores al
 * manipular información relacionada con compras, facturas,
 * productos y métodos de pago.
 *
 * ==============================================================
 *
 * ELEMENTOS DEFINIDOS
 *
 * • PaymentMethod
 * • OrderStatus
 * • OrderLineItem
 * • Order
 *
 * ==============================================================
 */