import React from 'react';
import { MessageSquare } from 'lucide-react';
import { ChatWindow } from './ChatWindow';
import type { ChatBubbleMessage } from './MessageBubble';

interface LiveChatPanelProps {
  sessionId: string | null;
  customerName?: string | null;
  messages: ChatBubbleMessage[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  sending?: boolean;
  error?: string | null;
  connected?: boolean;
}

export const LiveChatPanel: React.FC<LiveChatPanelProps> = ({
  sessionId,
  customerName,
  messages,
  inputValue,
  onInputChange,
  onSend,
  sending = false,
  error,
  connected = false,
}) => {
  if (!sessionId) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#16191b] border border-gray-800 text-gray-500">
        <MessageSquare className="w-8 h-8 mb-3 opacity-40" />
        <p className="text-xs font-mono uppercase tracking-wider">
          Selecciona un ticket para chatear
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      <div className="px-4 py-3 bg-[#16191b] border border-b-0 border-gray-800 flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-white text-sm font-bold font-mono uppercase tracking-wider">
            {customerName || 'Chat en vivo'}
          </h3>
          <p className="text-[10px] text-gray-500 font-mono mt-0.5">
            Sesión #{sessionId} · historial bot + cliente
          </p>
        </div>
        <span
          className={`text-[9px] font-mono uppercase tracking-widest px-2 py-1 border ${
            connected
              ? 'text-[#00ece0] border-[#00ece0]/30 bg-[#00ece0]/10'
              : 'text-gray-500 border-gray-700'
          }`}
        >
          {connected ? 'Conectado' : 'Desconectado'}
        </span>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <ChatWindow
          messages={messages}
          inputValue={inputValue}
          onInputChange={onInputChange}
          onSend={onSend}
          sending={sending}
          error={error}
          placeholder="Responder al cliente..."
          perspective="advisor"
        />
      </div>
    </div>
  );
};

export default LiveChatPanel;
