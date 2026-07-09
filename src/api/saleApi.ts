import type { AxiosError } from "axios";
import httpClient from "./httpClient";

export interface SaleDetailDto {
  saleDetailId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface SaleDto {
  saleId: number;
  customerName: string;
  originName: string;
  statusName: string;
  saleDate: string;
  total: number;
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
}

export interface SaleResultDto {
  success: boolean;
  saleId: number | null;
  invoiceNumber: string | null;
  total: number | null;
  message: string;
}

/**
 * Trae todas las ventas (Administrador/Asesor, requiere token).
 */
export async function getAllSales(): Promise<SaleDto[]> {
  const response = await httpClient.get<SaleDto[]>("/sales");
  return response.data;
}

/**
 * Trae una venta por su Id (Administrador/Asesor, requiere token).
 */
export async function getSaleById(id: number): Promise<SaleDto> {
  const response = await httpClient.get<SaleDto>(`/sales/${id}`);
  return response.data;
}

/**
 * Crea una venta (endpoint público, usado tanto por el panel manual como por el chatbot).
 * El backend responde 400 cuando la venta falla (p. ej. sin stock); en ese caso
 * devolvemos igualmente el SaleResultDto (con success: false) en vez de propagar el error.
 */
export async function createSale(data: CreateSaleRequest): Promise<SaleResultDto> {
  try {
    const response = await httpClient.post<SaleResultDto>("/sales", data);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<SaleResultDto>;
    if (axiosError.response?.data) {
      return axiosError.response.data;
    }
    throw error;
  }
}

/**
 * Cambia el estado de una venta (Administrador/Asesor, requiere token).
 */
export async function changeSaleStatus(id: number, saleStatusId: number): Promise<SaleDto> {
  const response = await httpClient.patch<SaleDto>(`/sales/${id}/status`, { saleStatusId });
  return response.data;
}
