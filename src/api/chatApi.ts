import httpClient from "./httpClient";

export interface ChatMessageRequest {
  sessionId: string;
  message: string;
}

export interface ChatMessageResponse {
  sessionId: string;
  response: string;
  state: string;
  invoiceNumber: string | null;
}

/**
 * Envía un mensaje del cliente al chatbot y devuelve la respuesta del bot.
 * Si sessionId viene vacío, el backend crea una sesión de chat nueva.
 */
export async function sendChatMessage(request: ChatMessageRequest): Promise<ChatMessageResponse> {
  const response = await httpClient.post<ChatMessageResponse>("/chat/message", request);
  return response.data;
}
