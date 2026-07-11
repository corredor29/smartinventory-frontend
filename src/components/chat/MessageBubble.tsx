import React from 'react';
import type { ChatUiProduct } from '../../utils/chatHistory';

export type ChatSenderRole = 'cliente' | 'bot' | 'asesor';

export interface ChatBubbleMessage {
  id: string;
  content: string;
  /** @deprecated prefer role — true = cliente */
  isUser: boolean;
  role?: ChatSenderRole;
  timestamp: string;
  senderLabel?: string;
  /** Si está presente, el ChatWindow muestra tarjetas de producto. */
  products?: ChatUiProduct[];
}

interface MessageBubbleProps {
  message: ChatBubbleMessage;
  /** Vista del asesor: cliente a la izquierda, bot/asesor a la derecha estilo chat */
  perspective?: 'client' | 'advisor';
}

function resolveRole(message: ChatBubbleMessage): ChatSenderRole {
  if (message.role) return message.role;
  const label = (message.senderLabel || '').toLowerCase();
  if (message.isUser || label.includes('cliente')) return 'cliente';
  if (label.includes('asesor')) return 'asesor';
  return 'bot';
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  perspective = 'client',
}) => {
  const role = resolveRole(message);

  // Cliente (FAB): usuario a la derecha. Asesor: cliente izquierda, respuestas derecha.
  const alignEnd =
    perspective === 'advisor' ? role !== 'cliente' : role === 'cliente';

  const bubbleClass =
    role === 'cliente'
      ? 'bg-[#ff4655] text-white border border-[#ff4655]/40'
      : role === 'asesor'
        ? 'bg-[#00ece0]/15 text-[#e8fffc] border border-[#00ece0]/40'
        : 'bg-[#16191b] text-gray-300 border border-gray-700';

  const labelClass =
    role === 'asesor'
      ? 'text-[#00ece0]'
      : role === 'bot'
        ? 'text-[#fbbf24]'
        : 'text-white/70';

  const label =
    message.senderLabel ||
    (role === 'cliente' ? 'Cliente' : role === 'asesor' ? 'Asesor' : 'Bot');

  return (
    <div className={`flex ${alignEnd ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[78%] px-3 py-2 text-xs ${bubbleClass}`}>
        <p className={`text-[9px] font-mono uppercase tracking-wider mb-1 ${labelClass}`}>
          {label}
        </p>
        <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
        <p className="text-[9px] mt-1 opacity-60 font-mono">{message.timestamp}</p>
      </div>
    </div>
  );
};

export default MessageBubble;
