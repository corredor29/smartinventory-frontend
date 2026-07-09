import React, { useState } from 'react';
import { MessageCircle, X, Send, Minus } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: string;
}

export const SupportFab = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: '¡Hola! Soy Killjoy, tu asistente táctico. ¿En qué puedo ayudarte hoy?',
      isUser: false,
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const quickResponses = [
    '¿Cómo realizo un pedido?',
    '¿Cuáles son los métodos de pago?',
    '¿Cuánto tarda el envío?',
    '¿Tienen política de devolución?',
    'Contactar soporte humano',
  ];

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    const newUserMessage: Message = {
      id: messages.length + 1,
      text,
      isUser: true,
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setMessage('');

    // Simular respuesta automática
    setTimeout(() => {
      const responses: Record<string, string> = {
        'pedido': 'Para realizar un pedido, navega por nuestro catálogo, añade productos al carrito y completa el checkout. Todo el proceso está optimizado para máxima eficiencia.',
        'pago': 'Aceptamos tarjetas de crédito/débito, transferencias bancarias y pago contra entrega. Todas las transacciones son seguras.',
        'envío': 'Nuestro despliegue logístico garantiza entregas en 24-48 horas según tu ubicación. Zonas tácticas prioritarias reciben en 24h.',
        'devolución': 'Ofrecemos 30 días para devoluciones. El producto debe estar en condiciones originales. Procesamos reembolsos en 5-7 días hábiles.',
        'soporte': 'Un agente humano se conectará contigo en breve. Mientras tanto, puedo ayudarte con consultas generales.',
      };

      const lowerText = text.toLowerCase();
      let responseText = 'Entiendo tu consulta. Un especialista revisará tu caso y te responderá pronto. ¿Hay algo más en lo que pueda ayudarte?';

      for (const [key, value] of Object.entries(responses)) {
        if (lowerText.includes(key)) {
          responseText = value;
          break;
        }
      }

      const botResponse: Message = {
        id: messages.length + 2,
        text: responseText,
        isUser: false,
        timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botResponse]);
    }, 1000);
  };

  const handleQuickResponse = (response: string) => {
    handleSendMessage(response);
  };

  const CLIP_CHAT = 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)';

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat Widget */}
      {isOpen && (
        <div
          className="w-80 sm:w-96 bg-[#1f2326] border border-gray-700 shadow-2xl shadow-black/50 flex flex-col transition-all duration-300"
          style={{
            clipPath: CLIP_CHAT,
            maxHeight: isMinimized ? '60px' : '500px',
          }}
        >
          {/* Header */}
          <div className="bg-[#16191b] border-b border-gray-800 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#00ece0] rounded-full flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-[#0f1923]" />
              </div>
              <div>
                <h3 className="text-white text-sm font-bold font-mono uppercase tracking-wider">Killjoy Bot</h3>
                <p className="text-[10px] text-[#00ece0] font-mono uppercase tracking-widest">En línea</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 text-gray-500 hover:text-white transition-colors"
                title={isMinimized ? 'Expandir' : 'Minimizar'}
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-500 hover:text-[#ff4655] transition-colors"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-80">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 text-xs ${
                        msg.isUser
                          ? 'bg-[#ff4655] text-white'
                          : 'bg-[#16191b] border border-gray-700 text-gray-300'
                      }`}
                    >
                      <p className="leading-relaxed">{msg.text}</p>
                      <p className="text-[9px] mt-1 opacity-60 font-mono">{msg.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Responses */}
              <div className="px-4 pb-2">
                <div className="flex flex-wrap gap-2">
                  {quickResponses.slice(0, 3).map((response) => (
                    <button
                      key={response}
                      onClick={() => handleQuickResponse(response)}
                      className="text-[10px] px-2 py-1 bg-[#16191b] border border-gray-700 text-gray-400 hover:border-[#00ece0] hover:text-[#00ece0] transition-colors font-mono uppercase"
                    >
                      {response}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-gray-800">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage(message);
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escribe tu mensaje..."
                    className="flex-1 px-3 py-2 bg-[#16191b] border border-gray-700 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-[#00ece0] focus:ring-1 focus:ring-[#00ece0] transition-all font-mono"
                  />
                  <button
                    type="submit"
                    disabled={!message.trim()}
                    className="px-3 py-2 bg-[#00ece0] hover:bg-[#00d4ce] disabled:opacity-50 disabled:cursor-not-allowed text-[#0f1923] transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 bg-[#ff4655] hover:bg-[#e63e4c] text-white shadow-lg shadow-[#ff4655]/30 transition-all duration-300 flex items-center justify-center ${
          isOpen ? 'rotate-45' : 'hover:scale-110'
        }`}
        style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
        title={isOpen ? 'Cerrar chat' : 'Abrir soporte'}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
};
