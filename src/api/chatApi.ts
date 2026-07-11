import httpClient from "./httpClient";
import type { ChatMessageDto } from "./signalR";

export interface ChatMessageRequest {
  sessionId: string;
  message: string;
  /** Si el cliente está logueado, ayuda a vincular la sesión al Customer. */
  customerId?: number | null;
}

export interface ChatProductCardDto {
  productId: number;
  name: string;
  description?: string | null;
  price: number;
  categoryName: string;
  statusName: string;
  currentStock: number;
  imageUrl?: string | null;
}

export interface ChatMessageResponse {
  sessionId: string;
  response: string;
  state: string;
  invoiceNumber: string | null;
  saleOrigin?: string | null;
  products?: ChatProductCardDto[];
}

/**
 * Envía un mensaje del cliente al chatbot y devuelve la respuesta del bot.
 * Si sessionId no es un número parseable (vacío / UUID), el backend crea una sesión nueva.
 */
export async function sendChatMessage(request: ChatMessageRequest): Promise<ChatMessageResponse> {
  const response = await httpClient.post<ChatMessageResponse>("/chat/message", request);
  return response.data;
}

/**
 * Trae el historial de mensajes de una sesión (Administrador/Asesor, requiere token).
 */
export async function getMessagesBySession(chatSessionId: number): Promise<ChatMessageDto[]> {
  const response = await httpClient.get<ChatMessageDto[]>(`/chat-messages/by-session/${chatSessionId}`);
  return response.data;
}

/**
 * Historial de una sesión de chat para el cliente (FAB / chatbot).
 * Usa el sessionId guardado en localStorage.
 */
export async function getChatSessionMessages(sessionId: string | number): Promise<ChatMessageDto[]> {
  const response = await httpClient.get<ChatMessageDto[]>(`/chat/session/${sessionId}/messages`);
  return response.data;
}
