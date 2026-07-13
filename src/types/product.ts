export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  active: boolean;
  image: string;
  description: string;
}

/**
 * ==============================================================
 * ARCHIVO: product.ts
 * UBICACIÓN: src/types/product.ts
 * ==============================================================
 *
 * PROPÓSITO
 *
 * Este archivo define la estructura de datos utilizada para
 * representar productos dentro de la aplicación.
 *
 * Al utilizar TypeScript Interfaces se garantiza que todos
 * los componentes trabajen con la misma estructura de datos,
 * reduciendo errores y mejorando el autocompletado del editor.
 *
 * La interfaz Product representa un producto del catálogo de
 * SmartInventory.
 *
 * ==============================================================
 *
 * ¿QUÉ ES UNA INTERFACE?
 *
 * Una Interface en TypeScript define la forma que debe tener
 * un objeto.
 *
 * No crea objetos ni contiene lógica.
 *
 * Simplemente establece qué propiedades deben existir y cuál
 * es el tipo de dato esperado.
 *
 * Ejemplo:
 *
 * const producto: Product = {
 *     id: "1",
 *     name: "Laptop Lenovo LOQ",
 *     category: "Laptops",
 *     price: 3500000,
 *     stock: 10,
 *     active: true,
 *     image: "imagen.jpg",
 *     description: "Laptop gamer"
 * }
 *
 * ==============================================================
 */