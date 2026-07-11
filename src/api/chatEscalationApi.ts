import httpClient from "./httpClient";

export interface ChatEscalationDto {
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
 * Crea una escalación de chat.
 * Usa /chat/escalate para vincular el Customer del JWT a la sesión
 * (así no se pierde el historial ni pide login si ya hay sesión activa).
 */
export async function createEscalation(sessionId: string, reason: string): Promise<ChatEscalationDto> {
  const response = await httpClient.post<Record<string, unknown>>("/chat/escalate", {
    sessionId,
    reason,
  });

  const data = response.data;
  return {
    chatEscalationId: Number(data.chatEscalationId ?? data.escalation_id ?? 0),
    chatSessionId: Number(data.chatSessionId ?? sessionId),
    customerId: (data.customerId as number | null | undefined) ?? null,
    customerName: (data.customerName as string | null | undefined) ?? null,
    reason,
    statusName: String(data.statusName ?? "Pendiente"),
    assignedUserName: null,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
  };
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
  const response = await httpClient.patch<ChatEscalationDto>(`/chat/escalations/${id}/resolve`, {});
  return response.data;
}
