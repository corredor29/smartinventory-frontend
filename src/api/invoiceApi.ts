import httpClient from "./httpClient";

export interface InvoiceItemDto {
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface InvoiceDto {
  invoiceId: number;
  invoiceNumber: string;
  issueDate: string;
  saleId: number;
  customerName: string;
  total: number;
  items: InvoiceItemDto[];
}

/**
 * Trae todas las facturas (Administrador/Asesor, requiere token).
 */
export async function getAllInvoices(): Promise<InvoiceDto[]> {
  const response = await httpClient.get<InvoiceDto[]>("/invoices");
  return response.data;
}

/**
 * Trae una factura por su Id (Administrador/Asesor, requiere token).
 */
export async function getInvoiceById(id: number): Promise<InvoiceDto> {
  const response = await httpClient.get<InvoiceDto>(`/invoices/${id}`);
  return response.data;
}

/**
 * Trae una factura por su número (endpoint público, usado para consultar una compra sin sesión).
 */
export async function getInvoiceByNumber(invoiceNumber: string): Promise<InvoiceDto> {
  const response = await httpClient.get<InvoiceDto>(`/invoices/number/${invoiceNumber}`);
  return response.data;
}
