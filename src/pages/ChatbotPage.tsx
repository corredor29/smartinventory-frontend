import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sendChatMessage, getChatSessionMessages } from '../api/chatApi';
import { resolveProductImageUrl, searchProducts } from '../api/productApi';
import {
  startChatConnection,
  stopChatConnection,
  joinSession,
  sendMessageToSession,
  onReceiveMessage,
  offReceiveMessage,
  type ChatMessageDto,
} from '../api/signalR';
import { ChatWindow } from '../components/chat/ChatWindow';
import type { ChatBubbleMessage } from '../components/chat/MessageBubble';
import type { ChatUiProduct } from '../utils/chatHistory';
import { formatChatTime } from '../utils/chatHistory';
import axios from 'axios';
import { getCustomerIdFromToken } from '../utils/jwt';
import { extractSearchQuery, formatFoundProductsMessage, refineProductsByQuery, sanitizeBotText } from '../utils/chatText';

const SESSION_STORAGE_KEY = 'smart_inventory_chat_session';
const MESSAGES_STORAGE_KEY = 'smart_inventory_chatbot_page_messages';

function formatTime(date: Date | string = new Date()) {
  return formatChatTime(date);
}

function welcomeBubble(): ChatBubbleMessage {
  return {
    id: 'welcome',
    content: '¡Hola! Soy Killjoy, tu asistente táctico. ¿En qué puedo ayudarte hoy?',
    isUser: false,
    timestamp: formatTime(),
    senderLabel: 'Killjoy Bot',
  };
}

function loadLocalMessages(): ChatBubbleMessage[] {
  try {
    const raw = localStorage.getItem(MESSAGES_STORAGE_KEY);
    if (!raw) return [welcomeBubble()];
    const parsed = JSON.parse(raw) as ChatBubbleMessage[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [welcomeBubble()];
  } catch {
    return [welcomeBubble()];
  }
}

function saveLocalMessages(messages: ChatBubbleMessage[]) {
  try {
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages.slice(-100)));
  } catch {
    // ignore quota
  }
}

function clearLocalChat() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
  localStorage.removeItem(MESSAGES_STORAGE_KEY);
}

function serverToBubble(msg: ChatMessageDto): ChatBubbleMessage {
  const lower = (msg.senderTypeName || '').toLowerCase();
  const isUser = lower.includes('cliente');
  const isAdvisor = lower.includes('asesor');
  return {
    id: String(msg.chatMessageId),
    content: msg.content,
    isUser,
    timestamp: formatTime(msg.sentAt),
    senderLabel: isUser ? undefined : isAdvisor ? 'Asesor' : msg.senderTypeName || 'Bot',
  };
}

function stateLabel(state: string): { text: string; color: string } {
  switch (state) {
    case 'WAITING_HUMAN_AGENT':
      return { text: 'Un asesor se unirá pronto...', color: '#fbbf24' };
    case 'NEED_LOGIN_FOR_AGENT':
      return { text: 'Inicia sesión para hablar con un asesor', color: '#ff4655' };
    case 'SALE_COMPLETED':
      return { text: 'Venta completada', color: '#00ece0' };
    case 'ERROR':
      return { text: 'Asistente no disponible', color: '#ff4655' };
    case 'IN_PROGRESS':
    default:
      return { text: 'Conversación en curso', color: '#00ece0' };
  }
}

function wantsAdvisor(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes('asesor') ||
    t.includes('humano') ||
    t.includes('persona') ||
    t.includes('soporte humano')
  );
}

function chatErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (err.response?.status === 429) {
      return 'Has enviado demasiados mensajes. Espera un momento e intenta de nuevo.';
    }
    if (!err.response) {
      return 'No se pudo conectar con el servidor. Verifica tu conexión.';
    }
    const msg = (err.response.data as { message?: string } | undefined)?.message;
    if (msg) return msg;
  }
  return 'Error al enviar el mensaje. Intenta de nuevo.';
}

export const ChatbotPage = () => {
  const { user, logout, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [sessionId, setSessionId] = useState<string>(() => {
    return localStorage.getItem(SESSION_STORAGE_KEY) || '';
  });
  const [messages, setMessages] = useState<ChatBubbleMessage[]>(() => loadLocalMessages());
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatState, setChatState] = useState('IN_PROGRESS');
  const [signalRConnected, setSignalRConnected] = useState(false);
  const sendingRef = useRef(false);
  const wasAuthenticated = useRef(isAuthenticated);
  const lastUserId = useRef<string | null>(user?.id ?? null);
  const historyLoadedRef = useRef(false);

  // Persistir mensajes localmente
  useEffect(() => {
    saveLocalMessages(messages);
  }, [messages]);

  // Restaurar historial del servidor al tener sessionId
  useEffect(() => {
    if (!sessionId || historyLoadedRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const serverMsgs = await getChatSessionMessages(sessionId);
        if (cancelled || !serverMsgs?.length) return;
        const bubbles = serverMsgs.map(serverToBubble);
        setMessages((prev) => {
          // Si solo hay welcome o menos mensajes locales que en servidor, usar servidor
          const meaningful = prev.filter((m) => m.id !== 'welcome');
          if (meaningful.length >= bubbles.length) return prev;
          return bubbles.length > 0 ? bubbles : prev;
        });
        historyLoadedRef.current = true;
      } catch {
        // sin historial remoto (anon / 404): se queda el local
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // Al cerrar sesión o cambiar de cuenta: limpiar historial de esta página
  useEffect(() => {
    const loggedOut = wasAuthenticated.current && !isAuthenticated;
    const switchedAccount =
      !!lastUserId.current && !!user?.id && lastUserId.current !== user.id;

    if (loggedOut || switchedAccount) {
      clearLocalChat();
      historyLoadedRef.current = false;
      setSessionId('');
      setChatState('IN_PROGRESS');
      setError(null);
      setInputValue('');
      setSignalRConnected(false);
      setMessages([welcomeBubble()]);
      stopChatConnection().catch(() => undefined);
    }

    wasAuthenticated.current = isAuthenticated;
    lastUserId.current = user?.id ?? null;
  }, [isAuthenticated, user?.id]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleNewConversation = () => {
    clearLocalChat();
    historyLoadedRef.current = false;
    setSessionId('');
    setChatState('IN_PROGRESS');
    setError(null);
    setMessages([welcomeBubble()]);
  };

  useEffect(() => {
    if (chatState !== 'WAITING_HUMAN_AGENT' || !sessionId || !isAuthenticated) return;

    let active = true;
    const handleMessage = (msg: ChatMessageDto) => {
      if (!active) return;
      const isUser = msg.senderTypeName.toLowerCase().includes('cliente');
      setMessages((prev) => {
        if (prev.some((m) => m.id === String(msg.chatMessageId))) return prev;
        return [
          ...prev,
          {
            id: String(msg.chatMessageId),
            content: msg.content,
            isUser,
            timestamp: formatTime(msg.sentAt),
            senderLabel: isUser ? undefined : msg.senderTypeName,
          },
        ];
      });
    };

    (async () => {
      try {
        await startChatConnection();
        await joinSession(sessionId);
        onReceiveMessage(handleMessage);
        if (active) setSignalRConnected(true);
      } catch (err) {
        console.error('Error conectando SignalR en chatbot:', err);
      }
    })();

    return () => {
      active = false;
      offReceiveMessage(handleMessage);
      setSignalRConnected(false);
    };
  }, [chatState, sessionId, isAuthenticated]);

  useEffect(() => {
    return () => {
      stopChatConnection().catch(() => undefined);
    };
  }, []);

  const dispatchMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || sendingRef.current) return;
      sendingRef.current = true;
      setSending(true);
      setError(null);

      const userMsg: ChatBubbleMessage = {
        id: `local-${Date.now()}`,
        content: text,
        isUser: true,
        timestamp: formatTime(),
      };
      setMessages((prev) => [...prev.filter((m) => !m.products), userMsg]);

      if (chatState === 'WAITING_HUMAN_AGENT' && signalRConnected && sessionId) {
        try {
          await sendMessageToSession(sessionId, text, 2);
        } catch (err: unknown) {
          setError(chatErrorMessage(err));
        } finally {
          sendingRef.current = false;
          setSending(false);
        }
        return;
      }

      try {
        const result = await sendChatMessage({
          sessionId: sessionId || '',
          message: text,
          customerId: user?.customerId ?? getCustomerIdFromToken(token) ?? null,
        });

        if (result.sessionId && result.sessionId !== sessionId) {
          setSessionId(result.sessionId);
          localStorage.setItem(SESSION_STORAGE_KEY, result.sessionId);
        }

        setChatState(result.state);

        const queryHint = extractSearchQuery(text);
        let productsFromBot = result.products ?? [];
        if (productsFromBot.length > 0 && queryHint) {
          productsFromBot = refineProductsByQuery(productsFromBot, queryHint);
        }
        const hasProducts = productsFromBot.length > 0;

        const botMsg: ChatBubbleMessage = {
          id: `bot-${Date.now()}`,
          content:
            hasProducts && queryHint
              ? formatFoundProductsMessage(productsFromBot.length, queryHint)
              : sanitizeBotText(result.response || '', { hasProducts }),
          isUser: false,
          timestamp: formatTime(),
          senderLabel: 'Killjoy Bot',
        };
        setMessages((prev) => [...prev, botMsg]);

        if (hasProducts) {
          const seeded: ChatUiProduct[] = productsFromBot.map((p) => ({
            id: String(p.productId),
            name: p.name,
            price: p.price,
            stock: p.currentStock,
            image: resolveProductImageUrl(p.imageUrl),
            category: p.categoryName,
          }));
          setMessages((prev) => [
            ...prev,
            {
              id: `products-${Date.now()}`,
              content: '',
              isUser: false,
              timestamp: formatTime(),
              products: seeded,
            },
          ]);
        } else {
          // Fallback cliente: frases naturales sin products del bot
          const query = queryHint || extractSearchQuery(text);
          if (query) {
            try {
              const found = refineProductsByQuery(await searchProducts(query), query);
              if (found.length > 0) {
                const seeded: ChatUiProduct[] = found.map((p) => ({
                  id: p.id,
                  name: p.name,
                  price: p.price,
                  stock: p.stock,
                  image: resolveProductImageUrl(p.image),
                  category: p.category,
                }));
                const successLine = formatFoundProductsMessage(seeded.length, query);
                setMessages((prev) => {
                  const next = [...prev];
                  for (let i = next.length - 1; i >= 0; i -= 1) {
                    const m = next[i];
                    if (!m.isUser && !m.products) {
                      next[i] = { ...m, content: successLine };
                      break;
                    }
                  }
                  return [
                    ...next,
                    {
                      id: `products-${Date.now()}`,
                      content: '',
                      isUser: false,
                      timestamp: formatTime(),
                      products: seeded,
                    },
                  ];
                });
              }
            } catch {
              // ignore search fallback errors
            }
          }
        }

        if (result.invoiceNumber) {
          const origin = result.saleOrigin ? ` · Origen: ${result.saleOrigin}` : '';
          setMessages((prev) => [
            ...prev,
            {
              id: `invoice-${Date.now()}`,
              content: `Factura generada: ${result.invoiceNumber}${origin}`,
              isUser: false,
              timestamp: formatTime(),
              senderLabel: 'Sistema',
            },
          ]);
        }

        if (result.state === 'NEED_LOGIN_FOR_AGENT') {
          setError('Debes iniciar sesión para hablar con un asesor.');
        }

        if (result.state === 'ERROR') {
          setError(result.response || 'El asistente no está disponible ahora.');
        }
      } catch (err: unknown) {
        setError(chatErrorMessage(err));
      } finally {
        sendingRef.current = false;
        setSending(false);
      }
    },
    [sessionId, chatState, signalRConnected, user?.customerId, token]
  );

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || sending) return;

    if (wantsAdvisor(text) && !isAuthenticated) {
      setMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          content: text,
          isUser: true,
          timestamp: formatTime(),
        },
        {
          id: `sys-${Date.now()}`,
          content:
            'Para hablar con un asesor necesitas una cuenta. Inicia sesión o regístrate e intenta de nuevo.',
          isUser: false,
          timestamp: formatTime(),
          senderLabel: 'Sistema',
        },
      ]);
      setInputValue('');
      setChatState('NEED_LOGIN_FOR_AGENT');
      setError('Debes iniciar sesión para hablar con un asesor.');
      return;
    }

    setInputValue('');
    await dispatchMessage(text);
  }, [inputValue, sending, isAuthenticated, dispatchMessage]);

  const handleSelectProduct = useCallback(
    (product: ChatUiProduct, quantity: number) => {
      const qty = Math.max(1, quantity);
      void dispatchMessage(`Quiero comprar ${qty} unidad(es) de ${product.name}`);
    },
    [dispatchMessage]
  );

  const handleDismissProducts = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);

  const status = stateLabel(chatState);

  return (
    <div className="min-h-screen bg-[#0d1117] p-6 font-mono flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-wider flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-[#00ece0]" />
            Asistente <span className="text-[#00ece0]">//</span> Killjoy Bot
          </h1>
          <p className="text-gray-500 text-xs mt-1 uppercase tracking-widest">
            Chatbot de soporte y ventas
            {user?.username ? ` · ${user.username}` : ''}
            {token ? '' : ' · Anónimo'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleNewConversation}
            className="flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-[#00ece0] hover:bg-[#00ece0]/10 text-[10px] font-mono uppercase tracking-wider transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Nueva conversación
          </button>
          {user && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 text-[10px] font-mono uppercase tracking-wider transition-all"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 max-w-3xl w-full mx-auto min-h-[500px] h-[calc(100vh-10rem)]">
        <ChatWindow
          messages={messages}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSend={handleSend}
          sending={sending}
          error={error}
          onSelectProduct={handleSelectProduct}
          onDismissProducts={handleDismissProducts}
          statusBanner={
            <div
              className="px-4 py-2 border-b border-gray-800 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider gap-3"
              style={{ color: status.color }}
            >
              <span>{status.text}</span>
              {chatState === 'NEED_LOGIN_FOR_AGENT' && (
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-[#00ece0] underline shrink-0"
                >
                  Ir a iniciar sesión
                </button>
              )}
              {chatState === 'WAITING_HUMAN_AGENT' && (
                <span className={signalRConnected ? 'text-[#00ece0]' : 'text-gray-500'}>
                  {signalRConnected ? '● En vivo' : '○ Conectando...'}
                </span>
              )}
            </div>
          }
        />
      </div>
    </div>
  );
};

export default ChatbotPage;
