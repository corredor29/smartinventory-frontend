import httpClient from "./httpClient";

export interface ChatEscalationDto {
  chatEscalationId: number;
  chatSessionId: number;
  reason: string | null;
  statusName: string;
  assignedUserName: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

/**
 * Trae las escalaciones de chat pendientes (Administrador/Asesor, requiere token).
 */
export async function getPendingEscalations(): Promise<ChatEscalationDto[]> {
  const response = await httpClient.get<ChatEscalationDto[]>("/chat/escalations/pending");
  return response.data;
}

/**
 * Trae una escalación específica por su Id (Administrador/Asesor, requiere token).
 */
export async function getEscalationById(id: number): Promise<ChatEscalationDto> {
  const response = await httpClient.get<ChatEscalationDto>(`/chat/escalations/${id}`);
  return response.data;
}

/**
 * Crea una escalación de chat (la dispara el chatbot cuando no puede resolver la consulta).
 */
export async function createEscalation(sessionId: string, reason: string): Promise<ChatEscalationDto> {
  const response = await httpClient.post<ChatEscalationDto>("/chat/escalations", { sessionId, reason });
  return response.data;
}

/**
 * Asigna una escalación a un asesor/administrador (requiere token).
 */
export async function assignEscalation(id: number, userId: number): Promise<ChatEscalationDto> {
  const response = await httpClient.patch<ChatEscalationDto>(`/chat/escalations/${id}/assign`, { userId });
  return response.data;
}

/**
 * Marca una escalación como resuelta (requiere token).
 */
export async function resolveEscalation(id: number): Promise<ChatEscalationDto> {
  const response = await httpClient.patch<ChatEscalationDto>(`/chat/escalations/${id}/resolve`);
  return response.data;
}
