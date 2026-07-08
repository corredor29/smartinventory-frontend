export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  active: boolean;
  /** Nombre del archivo dentro de src/assets/products/ (ej: "foto1.png") */
  image: string;
  /** Descripción corta que se muestra en el modal de detalle */
  description: string;
}

