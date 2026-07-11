import httpClient from "./httpClient";

export interface SaleStatusDto {
  saleStatusId: number;
  name: string;
}

/** Catálogo de estados de venta (Pendiente, Completada, Cancelada, ...). */
export async function getSaleStatuses(): Promise<SaleStatusDto[]> {
  const response = await httpClient.get<SaleStatusDto[]>("/sale-statuses");
  return response.data;
}
