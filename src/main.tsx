import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppRoutes } from './routes/AppRoutes'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { OrdersProvider } from './context/OrdersContext'
import './styles/global.css'
import 'leaflet/dist/leaflet.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <CartProvider>
        <OrdersProvider>
          <AppRoutes />
        </OrdersProvider>
      </CartProvider>
    </AuthProvider>
  </React.StrictMode>,
)
/**
 * ==============================================================
 * ARCHIVO: main.tsx
 * UBICACIÓN: src/main.tsx
 * ==============================================================
 *
 * PROPÓSITO
 *
 * Este archivo constituye el punto de entrada de toda la
 * aplicación React.
 *
 * Su responsabilidad principal es inicializar React, registrar
 * los proveedores globales (Context API) y renderizar el
 * componente principal de rutas.
 *
 * Todo el frontend comienza su ejecución desde este archivo.
 *
 * ==============================================================
 * IMPORTACIONES
 * ==============================================================
 *
 * React
 *
 *     Librería principal utilizada para construir la interfaz
 *     de usuario.
 *
 * ReactDOM
 *
 *     Permite renderizar la aplicación React dentro del DOM
 *     del navegador.
 *
 * AppRoutes
 *
 *     Contiene todas las rutas de navegación de la aplicación.
 *
 * AuthProvider
 *
 *     Contexto encargado de administrar la autenticación del
 *     usuario.
 *
 * CartProvider
 *
 *     Contexto encargado de administrar el carrito de compras.
 *
 * OrdersProvider
 *
 *     Contexto encargado de administrar las órdenes realizadas
 *     por el usuario.
 *
 * global.css
 *
 *     Hoja de estilos global utilizada por toda la aplicación.
 *
 * leaflet.css
 *
 *     Estilos necesarios para que los mapas de Leaflet se
 *     rendericen correctamente.
 *
 * ==============================================================
 */