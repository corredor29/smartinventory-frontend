import type { AxiosError } from "axios";
import httpClient from "./httpClient";

export interface SaleDetailDto {
  saleDetailId: number;
  productId: number;
  productName: string;
  categoryName: string;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface SaleDto {
  saleId: number;
  customerName: string;
  originName: string;
  statusName: string;
  paymentMethod: string;
  saleDate: string;
  total: number;
  invoiceNumber: string | null;
  deliveryAddress?: string | null;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  contactPhone?: string | null;
  contactDocument?: string | null;
  details: SaleDetailDto[];
}

export interface SaleItemRequest {
  productId: number;
  quantity: number;
}

export interface CreateSaleRequest {
  customerId?: number;
  sessionId?: string;
  items: SaleItemRequest[];
  origin?: string;
  paymentMethod?: string;
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  contactPhone?: string;
  contactDocument?: string;
}

export interface SaleResultDto {
  success: boolean;
  saleId: number | null;
  invoiceNumber: string | null;
  total: number | null;
  message: string;
}

export async function getAllSales(): Promise<SaleDto[]> {
  const response = await httpClient.get<SaleDto[]>("/sales");
  return response.data;
}

/** Ventas del cliente autenticado (rol Cliente). */
export async function getMySales(): Promise<SaleDto[]> {
  const response = await httpClient.get<SaleDto[]>("/sales/mine");
  return response.data;
}

export async function getSaleById(id: number): Promise<SaleDto> {
  const response = await httpClient.get<SaleDto>(`/sales/${id}`);
  return response.data;
}

export async function createSale(data: CreateSaleRequest): Promise<SaleResultDto> {
  try {
    const response = await httpClient.post<SaleResultDto>("/sales", data);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<SaleResultDto | { message?: string }>;
    const body = axiosError.response?.data;
    if (body && typeof body === "object") {
      if ("saleId" in body || "invoiceNumber" in body) {
        return body as SaleResultDto;
      }
      return {
        success: false,
        saleId: null,
        invoiceNumber: null,
        total: null,
        message: body.message || "No se pudo completar la venta.",
      };
    }
    throw error;
  }
}

export async function changeSaleStatus(id: number, saleStatusId: number): Promise<SaleDto> {
  const response = await httpClient.patch<SaleDto>(`/sales/${id}/status`, { saleStatusId });
  return response.data;
}
