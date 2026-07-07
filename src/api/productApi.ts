import type { Product } from "../types/product";

// Catálogo mock — reemplaza esta función por una llamada real a tu backend .NET
// (por ejemplo: fetch(`${BASE_URL}/api/products`)) cuando el endpoint esté listo.
export async function getPublicProducts(): Promise<Product[]> {
  return mockProducts;
}

export const mockProducts: Product[] = [
  { id: "PRD-001", name: "Laptop Dell XPS 15", category: "Electrónicos", price: 1299, stock: 23, active: true },
  { id: "PRD-002", name: "Mouse Logitech MX Master 3", category: "Periféricos", price: 89, stock: 67, active: true },
  { id: "PRD-003", name: "Teclado Mecánico Redragon K552", category: "Periféricos", price: 45, stock: 34, active: true },
  { id: "PRD-004", name: "Monitor LG UltraWide 27\"", category: "Electrónicos", price: 399, stock: 8, active: true },
  { id: "PRD-005", name: "SSD Samsung 870 EVO 1TB", category: "Almacenamiento", price: 119, stock: 56, active: true },
  { id: "PRD-006", name: "Auriculares Sony WH-1000XM5", category: "Audio", price: 249, stock: 2, active: true },
  { id: "PRD-007", name: "Webcam Logitech C920", category: "Periféricos", price: 79, stock: 41, active: true },
  { id: "PRD-008", name: "Hub USB-C 7 en 1", category: "Accesorios", price: 39, stock: 90, active: true },
  { id: "PRD-009", name: "Silla Gamer Secretlab", category: "Mobiliario", price: 449, stock: 6, active: true },
  { id: "PRD-010", name: "iPad Air 5ta generación", category: "Electrónicos", price: 749, stock: 5, active: true },
  { id: "PRD-011", name: "Laptop Acer Aspire 5", category: "Electrónicos", price: 549, stock: 14, active: true },
  { id: "PRD-012", name: "Laptop Asus ROG Strix G16", category: "Electrónicos", price: 1499, stock: 6, active: true },
  { id: "PRD-013", name: "Laptop Lenovo ThinkPad X1 Carbon", category: "Electrónicos", price: 1699, stock: 4, active: true },
  { id: "PRD-014", name: "Laptop MSI Katana 15", category: "Electrónicos", price: 1099, stock: 9, active: true },
  { id: "PRD-015", name: "Laptop HP Pavilion 15", category: "Electrónicos", price: 629, stock: 18, active: true },
  { id: "PRD-016", name: "Laptop Alienware m16", category: "Electrónicos", price: 2399, stock: 3, active: true },
];
