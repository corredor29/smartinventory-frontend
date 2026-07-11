import type { Product } from "../types/product";
import httpClient from "./httpClient";

// Imagen de respaldo si el producto no tiene imageUrl (aún no se le asignó una)
const FALLBACK_IMAGE = "/placeholder-product.png";

const API_ORIGIN = (
  import.meta.env.VITE_DOTNET_API_URL || "http://localhost:5299/api"
).replace(/\/api\/?$/, "");

/** Convierte rutas relativas del backend (/uploads/...) en URL absoluta. */
export function resolveProductImageUrl(url: string | null | undefined): string {
  if (!url) return FALLBACK_IMAGE;
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:") ||
    url.startsWith("/")
  ) {
    if (url.startsWith("/uploads/")) return `${API_ORIGIN}${url}`;
    if (url.startsWith("/")) return url; // assets locales del frontend
    return url;
  }
  return url;
}

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
    image: resolveProductImageUrl(dto.imageUrl),
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
 * Si el backend no aplica initialStock, hace un ajuste de inventario de respaldo.
 */
export async function createProduct(data: {
  name: string;
  description?: string;
  price: number;
  categoryId: number;
  productStatusId: number;
  imageUrl?: string;
  initialStock?: number;
}): Promise<Product> {
  const initialStock = Math.max(0, Math.trunc(Number(data.initialStock ?? 0)) || 0);

  const response = await httpClient.post<ProductDto>("/products", {
    ...data,
    initialStock,
  });

  let product = mapProductDtoToProduct(response.data);

  // Respaldo: si el stock no quedó aplicado, ajustar inventario manualmente.
  if (initialStock > 0 && product.stock !== initialStock) {
    const { adjustStock } = await import("./inventoryApi");
    const delta = initialStock - product.stock;
    if (delta !== 0) {
      await adjustStock(
        Number(product.id),
        delta,
        "Stock inicial al crear producto",
      );
      product = { ...product, stock: initialStock };
    }
  }

  return product;
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
 * Cambia el estado de un producto (1 = Activo, 2 = Inactivo).
 */
export async function changeProductStatus(
  id: string,
  productStatusId: number
): Promise<Product> {
  const response = await httpClient.patch<ProductDto>(`/products/${id}/status`, productStatusId);
  return mapProductDtoToProduct(response.data);
}

/**
 * Sube una imagen de producto y devuelve la URL relativa guardada en el servidor.
 */
export async function uploadProductImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file, file.name);

  const response = await httpClient.post<{ imageUrl?: string; ImageUrl?: string }>(
    "/products/upload-image",
    formData,
    {
      transformRequest: [
        (data, headers) => {
          // Dejar que el navegador ponga multipart boundary automáticamente.
          if (data instanceof FormData && headers) {
            delete (headers as Record<string, unknown>)["Content-Type"];
          }
          return data;
        },
      ],
    },
  );

  const url = response.data?.imageUrl || response.data?.ImageUrl;
  if (!url) {
    throw new Error("El servidor no devolvió la URL de la imagen.");
  }
  return url;
}

/**
 * Elimina un producto (solo Administrador, requiere token).
 */
export async function deleteProduct(id: string): Promise<void> {
  await httpClient.delete(`/products/${id}`);
}