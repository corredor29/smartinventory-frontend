import httpClient from "./httpClient";

export interface InventoryDto {
  inventoryId: number;
  productId: number;
  productName: string;
  currentStock: number;
}

/**
 * Trae el inventario de todos los productos (Administrador/Asesor, requiere token).
 */
export async function getAllInventory(): Promise<InventoryDto[]> {
  const response = await httpClient.get<InventoryDto[]>("/inventory");
  return response.data;
}

/**
 * Trae un registro de inventario por su Id (Administrador/Asesor, requiere token).
 */
export async function getInventoryById(id: number): Promise<InventoryDto> {
  const response = await httpClient.get<InventoryDto>(`/inventory/${id}`);
  return response.data;
}

/**
 * Consulta el stock actual de un producto (endpoint público, usado por el chatbot).
 * El backend devuelve la propiedad en snake_case: { current_stock }.
 */
export async function getStockByProductId(productId: number): Promise<number> {
  const response = await httpClient.get<{ current_stock: number }>(`/inventory/${productId}/stock`);
  return response.data.current_stock;
}

/**
 * Ajusta el stock de un producto sumando/restando quantityChange (Administrador/Asesor, requiere token).
 */
export async function adjustStock(
  productId: number,
  quantityChange: number,
  reason?: string
): Promise<InventoryDto> {
  const response = await httpClient.patch<InventoryDto>(`/inventory/${productId}/adjust`, {
    quantityChange,
    reason,
  });
  return response.data;
}
