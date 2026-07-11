import { useState, useEffect, useCallback } from 'react';
import { Headphones } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useAdvisorAlerts } from '../context/AdvisorAlertContext';
import {
  getPendingEscalations,
  assignEscalation,
  resolveEscalation,
  type ChatEscalationDto,
} from '../api/chatEscalationApi';
import { getMessagesBySession } from '../api/chatApi';
import {
  startChatConnection,
  joinAsAdvisor,
  joinSession,
  leaveSession,
  sendMessageToSession,
  onReceiveMessage,
  offReceiveMessage,
  onNewEscalation,
  offNewEscalation,
  type ChatMessageDto,
  type ChatEscalationNotification,
} from '../api/signalR';
import { EscalationPanel } from '../components/chat/EscalationPanel';
import { LiveChatPanel } from '../components/chat/LiveChatPanel';
import type { ChatBubbleMessage, ChatSenderRole } from '../components/chat/MessageBubble';
import { getUserIdFromToken } from '../utils/jwt';
import { StaffHeader } from '../components/StaffHeader';

const ADVISOR_SENDER_TYPE_ID = 3;

function formatTime(date: Date | string = new Date()) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function resolveSenderRole(msg: ChatMessageDto): ChatSenderRole {
  const id = msg.senderTypeId;
  if (id === 2) return 'cliente';
  if (id === 3) return 'asesor';
  if (id === 1) return 'bot';

  const lower = (msg.senderTypeName || '').toLowerCase();
  if (lower.includes('cliente')) return 'cliente';
  if (lower.includes('asesor')) return 'asesor';
  if (lower.includes('bot')) return 'bot';
  return 'bot';
}

function mapDtoToBubble(msg: ChatMessageDto): ChatBubbleMessage {
  const role = resolveSenderRole(msg);
  return {
    id: String(msg.chatMessageId),
    content: msg.content,
    isUser: role === 'cliente',
    role,
    timestamp: formatTime(msg.sentAt),
    senderLabel: role === 'cliente' ? 'Cliente' : role === 'asesor' ? 'Asesor' : 'Bot',
  };
}

function apiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string; title?: string } | undefined;
    if (data?.message) return data.message;
    if (err.response?.status === 401) return 'Sesión expirada. Vuelve a iniciar sesión.';
    if (err.response?.status === 403) return 'No tienes permiso para esta acción.';
    if (err.response?.status === 404) return 'Ticket no encontrado.';
    if (!err.response) return 'No hay conexión con el API.';
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export const SupportPage = () => {
  const { user, token } = useAuth();
  const { refreshPending } = useAdvisorAlerts();

  const [escalations, setEscalations] = useState<ChatEscalationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ChatEscalationDto | null>(null);
  const [messages, setMessages] = useState<ChatBubbleMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);

  const loadEscalations = useCallback(async () => {
    try {
      const data = await getPendingEscalations();
      setEscalations(data);
      setListError(null);
      await refreshPending();
    } catch (err) {
      console.error('Error cargando escalaciones:', err);
      setListError('No se pudieron cargar los tickets pendientes.');
    } finally {
      setLoading(false);
    }
  }, [refreshPending]);

  useEffect(() => {
    loadEscalations();

    const handleNewEscalation = (esc: ChatEscalationNotification) => {
      setEscalations((prev) => {
        if (prev.some((e) => e.chatEscalationId === esc.chatEscalationId)) return prev;
        return [esc, ...prev];
      });
    };

    let active = true;
    (async () => {
      try {
        await startChatConnection();
        await joinAsAdvisor();
        onNewEscalation(handleNewEscalation);
        if (active) setConnected(true);
      } catch (err) {
        console.error('Error conectando SignalR como asesor:', err);
        setListError(
          'Conexión en tiempo real no disponible. Los tickets se cargan, pero sin notificaciones live.'
        );
      }
    })();

    return () => {
      active = false;
      offNewEscalation(handleNewEscalation);
    };
  }, [loadEscalations]);

  useEffect(() => {
    if (!selected) {
      setMessages([]);
      return;
    }

    const sessionId = String(selected.chatSessionId);
    const sessionIdNum = selected.chatSessionId;
    let active = true;

    const handleMessage = (msg: ChatMessageDto) => {
      if (!active || msg.chatSessionId !== sessionIdNum) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === String(msg.chatMessageId))) return prev;
        const withoutTemp = prev.filter(
          (m) => !(m.id.startsWith('temp-') && m.content === msg.content)
        );
        return [...withoutTemp, mapDtoToBubble(msg)];
      });
    };

    (async () => {
      try {
        setChatError(null);
        const history = await getMessagesBySession(sessionIdNum);
        if (active) setMessages(history.map(mapDtoToBubble));

        await startChatConnection();
        await joinSession(sessionId);
        onReceiveMessage(handleMessage);
        if (active) setConnected(true);
      } catch (err) {
        console.error('Error uniéndose a la sesión:', err);
        if (active) setChatError('No se pudo cargar el historial de la sesión.');
      }
    })();

    return () => {
      active = false;
      offReceiveMessage(handleMessage);
      leaveSession(sessionId).catch(() => undefined);
    };
  }, [selected?.chatSessionId]);

  const ensureAssigned = async (esc: ChatEscalationDto): Promise<ChatEscalationDto> => {
    if (esc.assignedUserName) return esc;

    const userId = getUserIdFromToken(token);
    if (!userId) {
      throw new Error('No se pudo obtener tu UserId del token. Vuelve a iniciar sesión.');
    }

    const updated = await assignEscalation(esc.chatEscalationId, userId);
    setEscalations((prev) =>
      prev.map((e) => (e.chatEscalationId === updated.chatEscalationId ? updated : e))
    );
    setSelected(updated);
    await refreshPending();
    return updated;
  };

  const handleAssign = async (esc: ChatEscalationDto) => {
    setAssigningId(esc.chatEscalationId);
    setListError(null);
    try {
      await ensureAssigned(esc);
    } catch (err) {
      console.error('Error asignando escalación:', err);
      setListError(apiErrorMessage(err, 'No se pudo tomar el ticket.'));
    } finally {
      setAssigningId(null);
    }
  };

  const handleResolve = async (esc: ChatEscalationDto) => {
    setResolvingId(esc.chatEscalationId);
    setListError(null);
    try {
      await resolveEscalation(esc.chatEscalationId);
      setEscalations((prev) => prev.filter((e) => e.chatEscalationId !== esc.chatEscalationId));
      if (selected?.chatEscalationId === esc.chatEscalationId) {
        setSelected(null);
        setMessages([]);
      }
      await refreshPending();
    } catch (err) {
      console.error('Error resolviendo escalación:', err);
      setListError(apiErrorMessage(err, 'No se pudo marcar el ticket como resuelto.'));
    } finally {
      setResolvingId(null);
    }
  };

  const handleSend = async () => {
    if (!selected || !inputValue.trim() || sending) return;
    const content = inputValue.trim();
    setSending(true);
    setChatError(null);
    setInputValue('');

    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        content,
        isUser: false,
        role: 'asesor',
        timestamp: formatTime(),
        senderLabel: 'Asesor',
      },
    ]);

    try {
      // Tomar el ticket automáticamente al responder
      await ensureAssigned(selected);
      await startChatConnection();
      await joinSession(String(selected.chatSessionId));
      await sendMessageToSession(String(selected.chatSessionId), content, ADVISOR_SENDER_TYPE_ID);
    } catch (err) {
      console.error('Error enviando mensaje:', err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setChatError(apiErrorMessage(err, 'No se pudo enviar el mensaje.'));
      setInputValue(content);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-screen bg-[#0d1117] p-6 font-mono flex flex-col overflow-hidden">
      <StaffHeader
        title={
          <>
            <Headphones className="inline w-5 h-5 text-[#ff4655] mr-2 align-text-bottom" />
            Soporte <span className="text-[#00ece0]">//</span> Asesor
          </>
        }
        subtitle={`Escalaciones de chat en tiempo real${user?.username ? ` · ${user.username}` : ''}`}
        trailing={
          <span
            className={`text-[9px] font-mono uppercase tracking-widest px-2 py-1 border ${
              connected
                ? 'text-[#00ece0] border-[#00ece0]/30 bg-[#00ece0]/10'
                : 'text-gray-500 border-gray-700'
            }`}
          >
            {connected ? '● SignalR' : '○ Offline'}
          </span>
        }
      />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 min-h-0 overflow-hidden">
        <div className="min-h-0 h-full overflow-hidden">
          <EscalationPanel
            escalations={escalations}
            loading={loading}
            error={listError}
            selectedId={selected?.chatEscalationId}
            onSelect={setSelected}
            onAssign={handleAssign}
            onResolve={handleResolve}
            assigningId={assigningId}
            resolvingId={resolvingId}
          />
        </div>
        <div className="min-h-0 h-full overflow-hidden">
          <LiveChatPanel
            sessionId={selected ? String(selected.chatSessionId) : null}
            customerName={selected?.customerName}
            messages={messages}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSend={handleSend}
            sending={sending}
            error={chatError}
            connected={connected && !!selected}
          />
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
