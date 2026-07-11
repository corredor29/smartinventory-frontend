import React, { useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { MessageBubble, type ChatBubbleMessage } from './MessageBubble';
import { ChatProductPicker } from './ChatProductPicker';
import type { ChatUiProduct } from '../../utils/chatHistory';

interface ChatWindowProps {
  messages: ChatBubbleMessage[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  sending?: boolean;
  disabled?: boolean;
  placeholder?: string;
  statusBanner?: React.ReactNode;
  error?: string | null;
  perspective?: 'client' | 'advisor';
  onSelectProduct?: (product: ChatUiProduct, quantity: number) => void;
  onDismissProducts?: (messageId: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  inputValue,
  onInputChange,
  onSend,
  sending = false,
  disabled = false,
  placeholder = 'Escribe tu mensaje...',
  statusBanner,
  error,
  perspective = 'client',
  onSelectProduct,
  onDismissProducts,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || sending || disabled) return;
    onSend();
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#1f2326] border border-gray-800">
      {statusBanner}

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 text-xs font-mono uppercase tracking-wider">
            Sin mensajes aún
          </div>
        ) : (
          messages.map((msg) =>
            msg.products && msg.products.length > 0 ? (
              <div key={msg.id} className="flex justify-start">
                <div className="w-full max-w-[95%]">
                  <ChatProductPicker
                    initialProducts={msg.products}
                    onAdd={(product, quantity) => onSelectProduct?.(product, quantity)}
                    onCancel={() => onDismissProducts?.(msg.id)}
                  />
                </div>
              </div>
            ) : (
              <MessageBubble key={msg.id} message={msg} perspective={perspective} />
            )
          )
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="mx-4 mb-2 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800 flex gap-2 shrink-0 bg-[#1f2326]">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || sending}
          className="flex-1 px-3 py-2 bg-[#16191b] border border-gray-700 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-[#00ece0] focus:ring-1 focus:ring-[#00ece0] transition-all font-mono disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || sending || disabled}
          className="px-3 py-2 bg-[#00ece0] hover:bg-[#00d4ce] disabled:opacity-50 disabled:cursor-not-allowed text-[#0f1923] transition-colors"
        >
          {sending ? (
            <span className="w-4 h-4 border-2 border-[#0f1923]/30 border-t-[#0f1923] rounded-full animate-spin block" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
