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
