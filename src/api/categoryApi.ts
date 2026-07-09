import httpClient from "./httpClient";

export interface CategoryDto {
  categoryId: number;
  name: string;
}

/**
 * Trae todas las categorías de productos.
 */
export async function getCategories(): Promise<CategoryDto[]> {
  const response = await httpClient.get<CategoryDto[]>("/categories");
  return response.data;
}

/**
 * Trae una categoría específica por su Id.
 */
export async function getCategoryById(id: number): Promise<CategoryDto> {
  const response = await httpClient.get<CategoryDto>(`/categories/${id}`);
  return response.data;
}

/**
 * Crea una categoría nueva (solo Administrador, requiere token).
 */
export async function createCategory(name: string): Promise<CategoryDto> {
  const response = await httpClient.post<CategoryDto>("/categories", { name });
  return response.data;
}

/**
 * Actualiza una categoría existente (solo Administrador, requiere token).
 */
export async function updateCategory(id: number, name: string): Promise<CategoryDto> {
  const response = await httpClient.put<CategoryDto>(`/categories/${id}`, { name });
  return response.data;
}

/**
 * Elimina una categoría (solo Administrador, requiere token).
 */
export async function deleteCategory(id: number): Promise<void> {
  await httpClient.delete(`/categories/${id}`);
}
