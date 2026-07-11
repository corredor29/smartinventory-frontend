import type { ChatMessageDto } from '../api/signalR';

export const CHAT_SESSION_KEY = 'smart_inventory_chat_session';
export const CHAT_MESSAGES_KEY = 'smart_inventory_chat_messages';

export type ChatMessageKind = 'text' | 'products' | 'checkout' | 'invoice';

export interface ChatUiProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  image: string;
  category: string;
}

export interface ClientChatMessage {
  id: number | string;
  text: string;
  isUser: boolean;
  timestamp: string;
  senderLabel?: string;
  kind?: ChatMessageKind;
  product?: ChatUiProduct;
  checkout?: {
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    image?: string;
    items?: Array<{
      productId: string;
      productName: string;
      price: number;
      quantity: number;
      image?: string;
    }>;
  };
  invoice?: {
    number: string;
    total?: number | null;
  };
}

export function formatChatTime(date: Date | string = new Date()) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

export function loadStoredMessages(): ClientChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_MESSAGES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ClientChatMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredMessages(messages: ClientChatMessage[]) {
  try {
    // No persistir pickers abiertos (se regeneran); sí checkout/invoice/text
    const toStore = messages.filter((m) => m.kind !== 'products');
    localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(toStore.slice(-80)));
  } catch {
    // ignore quota
  }
}

export function clearStoredMessages() {
  localStorage.removeItem(CHAT_MESSAGES_KEY);
}

export function mapServerMessageToClient(msg: ChatMessageDto): ClientChatMessage {
  const lower = (msg.senderTypeName || '').toLowerCase();
  const isUser = lower.includes('cliente');
  const isAdvisor = lower.includes('asesor');
  return {
    id: String(msg.chatMessageId),
    text: msg.content,
    isUser,
    timestamp: formatChatTime(msg.sentAt),
    senderLabel: isUser ? undefined : isAdvisor ? 'Asesor' : msg.senderTypeName || 'Bot',
    kind: 'text',
  };
}

export function welcomeMessage(): ClientChatMessage {
  return {
    id: 'welcome',
    text: '¡Hola! Soy Killjoy, tu asistente táctico. Puedo ayudarte a buscar productos, armar tu pedido o conectarte con un asesor.',
    isUser: false,
    timestamp: formatChatTime(),
    senderLabel: 'Killjoy Bot',
    kind: 'text',
  };
}
