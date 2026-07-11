import * as signalR from "@microsoft/signalr";

const HUB_URL = import.meta.env.VITE_SIGNALR_HUB_URL || "http://localhost:5299/hubs/chat";

export interface ChatMessageDto {
  chatMessageId: number;
  chatSessionId: number;
  senderTypeId?: number;
  senderTypeName: string;
  content: string;
  sentAt: string;
}

export interface ChatEscalationNotification {
  chatEscalationId: number;
  chatSessionId: number;
  customerId?: number | null;
  customerName?: string | null;
  reason: string | null;
  statusName: string;
  assignedUserName: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

let connection: signalR.HubConnection | null = null;

/**
 * Crea (una sola vez) la conexión al hub de chat, pasando el JWT como
 * ?access_token=... tal como lo espera el JwtBearerEvents del backend para /hubs.
 */
function getChatConnection(): signalR.HubConnection {
  if (connection) return connection;

  connection = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () => localStorage.getItem("smart_inventory_token") || "",
    })
    .withAutomaticReconnect()
    .build();

  return connection;
}

export async function startChatConnection(): Promise<signalR.HubConnection> {
  const conn = getChatConnection();
  if (conn.state === signalR.HubConnectionState.Disconnected) {
    await conn.start();
  }
  return conn;
}

export async function stopChatConnection(): Promise<void> {
  if (connection && connection.state !== signalR.HubConnectionState.Disconnected) {
    await connection.stop();
  }
}

export function joinAsAdvisor(): Promise<void> {
  return getChatConnection().invoke("JoinAsAdvisor");
}

export function joinSession(sessionId: string): Promise<void> {
  return getChatConnection().invoke("JoinSession", sessionId);
}

export function leaveSession(sessionId: string): Promise<void> {
  return getChatConnection().invoke("LeaveSession", sessionId);
}

/**
 * senderTypeId sigue el seed del backend: 1 = Bot, 2 = Cliente, 3 = Asesor.
 */
export function sendMessageToSession(sessionId: string, content: string, senderTypeId: number): Promise<void> {
  return getChatConnection().invoke("SendMessageToSession", sessionId, content, senderTypeId);
}

export function onReceiveMessage(callback: (message: ChatMessageDto) => void): void {
  getChatConnection().on("ReceiveMessage", callback);
}

export function offReceiveMessage(callback: (message: ChatMessageDto) => void): void {
  getChatConnection().off("ReceiveMessage", callback);
}

export function onNewEscalation(callback: (escalation: ChatEscalationNotification) => void): void {
  getChatConnection().on("NewEscalation", callback);
}

export function offNewEscalation(callback: (escalation: ChatEscalationNotification) => void): void {
  getChatConnection().off("NewEscalation", callback);
}

export interface EscalationResolvedPayload {
  chatEscalationId: number;
  chatSessionId: number;
  statusName: string;
  message: string;
}

export function onEscalationResolved(callback: (payload: EscalationResolvedPayload) => void): void {
  getChatConnection().on("EscalationResolved", callback);
}

export function offEscalationResolved(callback: (payload: EscalationResolvedPayload) => void): void {
  getChatConnection().off("EscalationResolved", callback);
}
