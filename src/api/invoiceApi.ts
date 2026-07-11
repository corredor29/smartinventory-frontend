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
  paymentMethod?: string | null;
  deliveryAddress?: string | null;
  contactPhone?: string | null;
  contactDocument?: string | null;
  items: InvoiceItemDto[];
}

export async function getAllInvoices(): Promise<InvoiceDto[]> {
  const response = await httpClient.get<InvoiceDto[]>("/invoices");
  return response.data;
}

/** Facturas del cliente autenticado (rol Cliente). */
export async function getMyInvoices(): Promise<InvoiceDto[]> {
  const response = await httpClient.get<InvoiceDto[]>("/invoices/mine");
  return response.data;
}

export async function getInvoiceById(id: number): Promise<InvoiceDto> {
  const response = await httpClient.get<InvoiceDto>(`/invoices/${id}`);
  return response.data;
}

export async function getInvoiceByNumber(invoiceNumber: string): Promise<InvoiceDto> {
  const response = await httpClient.get<InvoiceDto>(`/invoices/number/${invoiceNumber}`);
  return response.data;
}

/** Descarga el PDF de una factura (blob). */
export async function downloadInvoicePdf(id: number, invoiceNumber?: string): Promise<void> {
  const response = await httpClient.get(`/invoices/${id}/pdf`, {
    responseType: "blob",
  });

  const blob =
    response.data instanceof Blob
      ? response.data
      : new Blob([response.data], { type: "application/pdf" });

  if (blob.type && blob.type.includes("json")) {
    const text = await blob.text();
    throw new Error(text || "No se pudo descargar la factura.");
  }

  const disposition = response.headers["content-disposition"] as string | undefined;
  let filename = `${invoiceNumber || `factura-${id}`}.pdf`;
  const match = disposition?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
  if (match?.[1]) {
    filename = match[1].replace(/['"]/g, "");
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
