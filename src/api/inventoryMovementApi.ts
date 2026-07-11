import httpClient from './httpClient';

export interface InventoryMovementDto {
  movementId: number;
  inventoryId: number;
  productName: string;
  movementTypeName: string;
  quantity: number;
  reason: string | null;
  createdAt: string;
}

export async function getAllMovements(): Promise<InventoryMovementDto[]> {
  const response = await httpClient.get<InventoryMovementDto[]>('/inventory-movements');
  return response.data;
}

export async function getMovementsByInventoryId(
  inventoryId: number,
): Promise<InventoryMovementDto[]> {
  const response = await httpClient.get<InventoryMovementDto[]>(
    `/inventory-movements/by-inventory/${inventoryId}`,
  );
  return response.data;
}
