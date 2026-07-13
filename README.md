# SmartInventory Frontend

Frontend de administración y usuario para SmartInventory, construido con **React + Vite + TypeScript**.

> Esta aplicación es el cliente web. Se comunica únicamente con la API .NET configurada en `VITE_DOTNET_API_URL` y no se conecta directamente al chatbot Python.

## Características principales

- Autenticación de usuarios y roles (`Client`, `admin`, `asesor`, `Operator`)
- Panel administrativo con gestión de productos, categorías, clientes, inventario, ventas y facturas
- Carrito de compras, pedidos y facturas para clientes finales
- Chatbot integrado con escalación a soporte en vivo vía **SignalR**
- Gestión de movimientos de inventario y stock
- Reportes visuales en dashboard y datos interactivos
- Generación de facturas y descarga/exportación desde el frontend

## Tecnologías

- React 19
- Vite
- TypeScript
- Tailwind CSS
- Axios
- React Router DOM
- React Hook Form
- Zod para validaciones
- SignalR para chat en tiempo real
- Leaflet para mapas y geolocalización
- Recharts para gráficas
- jsPDF para exportar facturas

## Requisitos previos

Necesitas tener preparado el backend y servicios asociados:

- API .NET (`SmartInventoryAPI`) en `http://localhost:5299`
- PostgreSQL en `5433`
- Chatbot Python en `http://localhost:8000`

### Procesos necesarios

- PostgreSQL
- API .NET
- Chatbot Python
- Frontend Vite

## Configuración local

Crea un archivo `.env` en la raíz del proyecto con al menos estas variables:

```env
VITE_DOTNET_API_URL=http://localhost:5299/api
VITE_SIGNALR_HUB_URL=http://localhost:5299/hubs/chat
```

> `httpClient` en `src/api/httpClient.ts` usa `VITE_DOTNET_API_URL` y añade el token JWT desde `localStorage` en cada petición.

## Instalación y ejecución

```bash
npm install
npm run dev
```

Luego abre:

```text
http://localhost:5173
```

## Scripts disponibles

- `npm run dev` — iniciar servidor de desarrollo
- `npm run build` — compilar la app para producción
- `npm run lint` — ejecutar ESLint
- `npm run preview` — servir la versión de producción local

## Rutas importantes

### Rutas públicas

- `/` — Home
- `/login` — Login de cliente
- `/admin-login` — Login de personal administrativo
- `/chatbot` — Chatbot público

### Rutas para cliente (`Client`)

- `/carrito` — Carrito de compras
- `/pedidos` — Pedidos
- `/facturas` — Facturas del cliente

### Rutas para staff (`admin`, `asesor`, `Operator`)

- `/dashboard` — Dashboard administrativo
- `/products` — Productos
- `/sales` — Ventas
- `/customers` — Clientes
- `/invoices` — Facturas administrativas
- `/movimientos` — Movimientos de inventario
- `/inventory-movements` — Alias de movimientos
- `/support` — Soporte en vivo
- `/killjoy-bot` — Alias del chatbot

### Rutas para administrador (`admin`)

- `/categories` — Categorías
- `/users` — Usuarios
- `/inventory` — Inventario

### Alias útiles

- `/armeria` → `/products`
- `/ventas` → `/sales`
- `/economia` → `/invoices`
- `/almacenamiento` → `/inventory`

## Integración de chat y soporte

- El chatbot usa `/api/chat/message` en el backend .NET
- El backend .NET envía mensajes al servicio Python del chatbot
- Las escalaciones en vivo se manejan con SignalR en `/hubs/chat`
- La sesión compartida del chat se guarda en `localStorage` como `smart_inventory_chat_session`

## Estructura principal del proyecto

- `src/api/` — cliente HTTP y llamadas a APIs
- `src/components/` — componentes reutilizables y paneles específicos
- `src/context/` — providers para auth, carrito, órdenes, chat y alertas
- `src/hooks/` — hooks personalizados
- `src/layouts/` — layouts para cliente y administrador
- `src/pages/` — páginas por ruta
- `src/routes/` — definición de rutas protegidas
- `src/styles/` — estilos globales
- `src/types/` — tipos TypeScript
- `src/utils/` — utilidades compartidas

## Notas adicionales

- La aplicación espera que el backend devuelva objetos JSON con un campo `data`; el interceptor de `axios` desenvuelve ese campo automáticamente.
- Para peticiones de tipo `blob` (por ejemplo, descargas de facturas) no se transforma la respuesta.
- El proyecto usa `React.StrictMode` y provee contextos anidados de `AuthProvider`, `CartProvider` y `OrdersProvider`.

## Recomendaciones

- Ejecutar `npm run lint` antes de producir una build
- Mantener el backend .NET y el servicio Python corriendo en paralelo
- Usar `VITE_SIGNALR_HUB_URL` cuando despliegues en entornos distintos a localhost

## Recursos

- `package.json` — dependencias y scripts
- `vite.config.ts` — configuración del bundler Vite
- `tsconfig.json` — configuración de TypeScript
- `src/routes/AppRoutes.tsx` — definición de rutas y permisos
- `src/api/httpClient.ts` — configuración de Axios y autenticación
