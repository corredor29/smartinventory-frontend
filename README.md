# SmartInventory Frontend

React + Vite + TypeScript. El front **solo** habla con la API .NET (`VITE_DOTNET_API_URL`); nunca con el chatbot Python.

## Arranque local (stack completo)

Necesitas **4 procesos** (Postgres + 3 apps):

| Servicio | Puerto | Repo / comando |
|---|---|---|
| PostgreSQL | `5433` | `SmartInventoryAPI` → `docker compose up -d` |
| API .NET | `5299` | `SmartInventoryAPI/Api` → `dotnet run` |
| Chatbot Python | `8000` | `smartinventory-chatbot` → ver README del repo |
| Frontend Vite | `5173` | este repo → `npm run dev` |

### 1. Variables

Copia `.env.example` si existe, o define en `.env`:

```env
VITE_DOTNET_API_URL=http://localhost:5299/api
VITE_SIGNALR_HUB_URL=http://localhost:5299/hubs/chat
```

### 2. Instalar y correr

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`.

### Chatbot / soporte

- Página dedicada: `/chatbot`
- FAB flotante en el resto de la app (misma sesión en `localStorage`: `smart_inventory_chat_session`)
- Cola de asesores: `/support` (roles Administrador / Asesor)
- Si Python (`:8000`) está caído, la UI muestra un error claro (el API no crashea)

### Flujo

```text
React → POST /api/chat/message → .NET → POST http://localhost:8000/chat/message
Python tools → .NET (productos, stock, ventas, escalaciones)
Escalación → SignalR /hubs/chat → SupportPage ↔ cliente
```
