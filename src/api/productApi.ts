import type { Product } from "../types/product";
import httpClient from "./httpClient";

// Imagen de respaldo si el producto no tiene imageUrl (aún no se le asignó una)
const FALLBACK_IMAGE = "/placeholder-product.png";

interface ProductDto {
  productId: number;
  name: string;
  description: string | null;
  price: number;
  categoryName: string;
  statusName: string;
  currentStock: number;
  imageUrl: string | null;
}

function mapProductDtoToProduct(dto: ProductDto): Product {
  return {
    id: String(dto.productId),
    name: dto.name,
    category: dto.categoryName,
    price: dto.price,
    stock: dto.currentStock,
    active: dto.statusName === "Activo",
    image: dto.imageUrl || FALLBACK_IMAGE,
    description: dto.description || "",
  };
}

/**
 * Trae todos los productos desde el backend real.
 * Reemplaza la función anterior que devolvía mockProducts.
 */
export async function getPublicProducts(): Promise<Product[]> {
  const response = await httpClient.get<ProductDto[]>("/products");
  return response.data.map(mapProductDtoToProduct);
}

/**
 * Búsqueda de productos (usa el mismo endpoint que consume el chatbot).
 */
export async function searchProducts(query: string): Promise<Product[]> {
  const response = await httpClient.get<{ found: boolean; products: ProductDto[] }>(
    "/products/search",
    { params: { q: query } }
  );
  return response.data.products.map(mapProductDtoToProduct);
}

/**
 * Trae un producto específico por su Id.
 */
export async function getProductById(id: string): Promise<Product> {
  const response = await httpClient.get<ProductDto>(`/products/${id}`);
  return mapProductDtoToProduct(response.data);
}

/**
 * Crea un producto nuevo (solo Administrador, requiere token).
 */
export async function createProduct(data: {
  name: string;
  description?: string;
  price: number;
  categoryId: number;
  productStatusId: number;
  imageUrl?: string;
}): Promise<Product> {
  const response = await httpClient.post<ProductDto>("/products", data);
  return mapProductDtoToProduct(response.data);
}

/**
 * Actualiza un producto existente (solo Administrador, requiere token).
 */
export async function updateProduct(
  id: string,
  data: {
    name: string;
    description?: string;
    price: number;
    categoryId: number;
    imageUrl?: string;
  }
): Promise<Product> {
  const response = await httpClient.put<ProductDto>(`/products/${id}`, data);
  return mapProductDtoToProduct(response.data);
}

/**
 * Elimina un producto (solo Administrador, requiere token).
 */
export async function deleteProduct(id: string): Promise<void> {
  await httpClient.delete(`/products/${id}`);
}


export const mockProducts: Product[] = [];