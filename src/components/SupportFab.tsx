import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, Send, Minus } from 'lucide-react';
import { sendChatMessage, getChatSessionMessages } from '../api/chatApi';
import { createEscalation } from '../api/chatEscalationApi';
import { createSale } from '../api/saleApi';
import { getMyCustomer } from '../api/customerApi';
import { resolveProductImageUrl, searchProducts } from '../api/productApi';
import {
  startChatConnection,
  joinSession,
  onReceiveMessage,
  offReceiveMessage,
  onEscalationResolved,
  offEscalationResolved,
  type ChatMessageDto,
  type EscalationResolvedPayload,
} from '../api/signalR';
import { useAuth } from '../context/AuthContext';
import { getCustomerIdFromToken } from '../utils/jwt';
import { fmtCurrency } from '../utils/currency';
import { extractSearchQuery, formatFoundProductsMessage, refineProductsByQuery, sanitizeBotText, splitBoldSegments } from '../utils/chatText';
import {
  CHAT_SESSION_KEY,
  loadStoredMessages,
  saveStoredMessages,
  clearStoredMessages,
  mapServerMessageToClient,
  welcomeMessage,
  formatChatTime,
  type ClientChatMessage,
  type ChatUiProduct,
} from '../utils/chatHistory';
import { ChatProductPicker } from './chat/ChatProductPicker';
import {
  ChatCheckoutForm,
  toCheckoutItem,
  type CheckoutFormValues,
  type CheckoutCartItem,
} from './chat/ChatCheckoutForm';
import axios from 'axios';

const SESSION_KEY = CHAT_SESSION_KEY;
const ADVISOR_QUICK = 'Contactar soporte humano';
const BUY_QUICK = 'Comprar producto';

function chatErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (err.response?.status === 429) {
      return 'Has enviado demasiados mensajes. Espera un momento e intenta de nuevo.';
    }
    if (err.response?.status === 401) {
      return 'Debes iniciar sesión para completar la compra.';
    }
    if (!err.response) {
      return 'No se pudo conectar con el servidor. Verifica tu conexión.';
    }
    const msg = (err.response.data as { message?: string } | undefined)?.message;
    if (msg) return msg;
  }
  return 'No se pudo enviar el mensaje. Intenta de nuevo.';
}

function isExplicitAdvisorRequest(text: string): boolean {
  const t = text.toLowerCase().trim();
  return (
    t.includes('asesor') ||
    t.includes('humano') ||
    t.includes('persona') ||
    t.includes('soporte humano') ||
    t === ADVISOR_QUICK.toLowerCase()
  );
}

function isPurchaseIntent(text: string): boolean {
  const t = text.toLowerCase().trim();
  return (
    t === BUY_QUICK.toLowerCase() ||
    t.includes('comprar') ||
    t.includes('quiero pedir') ||
    t.includes('hacer un pedido') ||
    t.includes('realizar un pedido') ||
    t.includes('armar pedido')
  );
}

/** Solo abre el catálogo vacío si NO hay marca/producto en el mensaje. */
function isBarePurchaseIntent(text: string): boolean {
  const t = text.toLowerCase().trim();
  if (t === BUY_QUICK.toLowerCase()) return true;
  if (!isPurchaseIntent(t)) return false;

  const stop = new Set([
    'me', 'mi', 'mis', 'gustaria', 'gustaría', 'quisiera', 'quiero', 'busco', 'necesito',
    'un', 'una', 'unos', 'unas', 'el', 'la', 'los', 'las', 'de', 'del', 'para', 'por',
    'favor', 'porfavor', 'hola', 'buenas', 'comprar', 'compra', 'producto', 'productos',
    'pedir', 'hacer', 'realizar', 'armar', 'pedido', 'algo', 'eso', 'este', 'esta',
  ]);
  const tokens = t
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const meaningful = tokens.filter((tok) => tok.length >= 3 && !stop.has(tok));
  return meaningful.length === 0;
}

function isAffirmative(text: string): boolean {
  const t = text.toLowerCase().trim();
  return ['si', 'sí', 'dale', 'ok', 'okay', 'claro', 'por favor', 'confirmo', 'yes'].includes(t);
}

export const SupportFab = () => {
  const { isAuthenticated, user, token } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatState, setChatState] = useState('IN_PROGRESS');
  const [sessionId, setSessionId] = useState(() => localStorage.getItem(SESSION_KEY) || '');
  const [signalRConnected, setSignalRConnected] = useState(false);
  const [messages, setMessages] = useState<ClientChatMessage[]>(() => {
    const stored = loadStoredMessages();
    return stored.length > 0 ? stored : [welcomeMessage()];
  });
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [chatCart, setChatCart] = useState<CheckoutCartItem[]>([]);
  const [pickerSeed, setPickerSeed] = useState<ChatUiProduct[] | undefined>(() => {
    const stored = loadStoredMessages();
    const lastPicker = [...stored].reverse().find((m) => m.kind === 'products' && m.products?.length);
    return lastPicker?.products;
  });
  const [profilePrefill, setProfilePrefill] = useState({
    name: '',
    phone: '',
    document: '',
  });
  const bottomRef = useRef<HTMLDivElement>(null);

  const resolvedCustomerId = user?.customerId ?? getCustomerIdFromToken(token) ?? null;
  const wasAuthenticated = useRef(isAuthenticated);
  const lastUserId = useRef<string | null>(user?.id ?? null);

  // Al cerrar sesión o cambiar de cuenta: limpiar historial en memoria y storage
  useEffect(() => {
    const loggedOut = wasAuthenticated.current && !isAuthenticated;
    const switchedAccount =
      !!lastUserId.current && !!user?.id && lastUserId.current !== user.id;

    if (loggedOut || switchedAccount) {
      clearStoredMessages();
      localStorage.removeItem(SESSION_KEY);
      setSessionId('');
      setMessages([welcomeMessage()]);
      setChatCart([]);
      setPickerSeed(undefined);
      setChatState('IN_PROGRESS');
      setSignalRConnected(false);
      setHistoryLoaded(true);
      setError(null);
      setMessage('');
      setIsOpen(false);
      setIsMinimized(false);
    }

    wasAuthenticated.current = isAuthenticated;
    lastUserId.current = user?.id ?? null;
  }, [isAuthenticated, user?.id]);

  // Prefills desde perfil del cliente
  useEffect(() => {
    if (!isAuthenticated || !resolvedCustomerId) {
      setProfilePrefill({ name: user?.username || '', phone: '', document: '' });
      return;
    }
    let active = true;
    (async () => {
      try {
        const me = await getMyCustomer();
        if (!active) return;
        setProfilePrefill({
          name: me.name || user?.username || '',
          phone: me.phone || '',
          document: me.documentNumber || '',
        });
      } catch {
        if (active) {
          setProfilePrefill({ name: user?.username || '', phone: '', document: '' });
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [isAuthenticated, resolvedCustomerId, user?.username]);

  // Persistir historial local (solo si hay sesión activa o mensajes reales)
  useEffect(() => {
    if (!sessionId && messages.length <= 1 && messages[0]?.id === 'welcome') {
      clearStoredMessages();
      return;
    }
    saveStoredMessages(messages);
  }, [messages, sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isMinimized]);

  // Cargar historial del servidor al abrir / al tener sessionId
  useEffect(() => {
    if (historyLoaded) return;
    const sid = sessionId || localStorage.getItem(SESSION_KEY) || '';
    if (!sid || !/^\d+$/.test(sid)) {
      setHistoryLoaded(true);
      return;
    }

    let active = true;
    (async () => {
      try {
        const serverMsgs = await getChatSessionMessages(sid);
        if (!active || serverMsgs.length === 0) return;
        const mapped = serverMsgs.map(mapServerMessageToClient);
        setMessages((prev) => {
          const localExtras = prev.filter(
            (m) =>
              m.kind === 'products' ||
              m.kind === 'checkout' ||
              m.kind === 'invoice' ||
              String(m.id).startsWith('local-') ||
              String(m.id).startsWith('invoice-')
          );
          // Preferir historial del servidor; conservar tarjetas/facturas locales
          return [...mapped, ...localExtras.filter((m) => !mapped.some((s) => s.text === m.text && s.kind === m.kind))];
        });
      } catch {
        // localStorage ya tiene respaldo
      } finally {
        if (active) setHistoryLoaded(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [sessionId, historyLoaded]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const stored = localStorage.getItem(SESSION_KEY) || '';
    setSessionId(stored);
    if (!stored) {
      setChatState('IN_PROGRESS');
      setSignalRConnected(false);
    }
  }, [isAuthenticated, resolvedCustomerId]);

  const quickResponses = [
    BUY_QUICK,
    '¿Cómo realizo un pedido?',
    '¿Cuáles son los métodos de pago?',
    ADVISOR_QUICK,
  ];

  useEffect(() => {
    if (chatState !== 'WAITING_HUMAN_AGENT' || !sessionId || !isAuthenticated) return;

    let active = true;
    const handleMessage = (msg: ChatMessageDto) => {
      if (!active) return;
      const lower = (msg.senderTypeName || '').toLowerCase();
      const isUser = lower.includes('cliente');
      const isAdvisor = lower.includes('asesor');
      const serverId = String(msg.chatMessageId);

      setMessages((prev) => {
        if (prev.some((m) => String(m.id) === serverId)) return prev;
        const withoutOptimistic = prev.filter((m) => {
          const id = String(m.id);
          const isTemp =
            id.startsWith('temp-') ||
            (!id.startsWith('invoice-') &&
              !id.startsWith('local-') &&
              !id.startsWith('welcome') &&
              Number.isFinite(Number(id)));
          if (!isTemp) return true;
          return !(m.isUser === isUser && m.text.trim() === (msg.content || '').trim());
        });
        return [
          ...withoutOptimistic,
          {
            id: serverId,
            text: msg.content,
            isUser,
            timestamp: formatChatTime(msg.sentAt),
            senderLabel: isUser ? undefined : isAdvisor ? 'Asesor' : msg.senderTypeName || 'Bot',
            kind: 'text',
          },
        ];
      });
    };

    const handleResolved = (payload: EscalationResolvedPayload) => {
      if (!active) return;
      setChatState('IN_PROGRESS');
      setSignalRConnected(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `local-resolved-${Date.now()}`,
          text:
            payload.message ||
            'El asesor marcó tu consulta como resuelta. Si necesitas algo más, escribe de nuevo.',
          isUser: false,
          timestamp: formatChatTime(),
          senderLabel: 'Sistema',
          kind: 'text',
        },
      ]);
    };

    (async () => {
      try {
        await startChatConnection();
        await joinSession(sessionId);
        onReceiveMessage(handleMessage);
        onEscalationResolved(handleResolved);
        if (active) setSignalRConnected(true);
      } catch (err) {
        console.error('Error conectando SignalR en SupportFab:', err);
        if (active) setError('Chat en vivo no disponible. Recarga la página o abre /chatbot.');
      }
    })();

    return () => {
      active = false;
      offReceiveMessage(handleMessage);
      offEscalationResolved(handleResolved);
      setSignalRConnected(false);
    };
  }, [chatState, sessionId, isAuthenticated]);

  const openProductPicker = useCallback((seed?: ChatUiProduct[]) => {
    const products = seed && seed.length > 0 ? seed : undefined;
    setPickerSeed(products);
    setMessages((prev) => {
      const withoutPicker = prev.filter((m) => m.kind !== 'products');
      return [
        ...withoutPicker,
        {
          id: `local-products-${Date.now()}`,
          text: 'Selecciona productos',
          isUser: false,
          timestamp: formatChatTime(),
          senderLabel: 'Pedido',
          kind: 'products',
          products,
        },
      ];
    });
  }, []);

  const handleAddToCart = useCallback((product: ChatUiProduct, quantity: number) => {
    setChatCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: Math.min(100, i.quantity + quantity) }
            : i
        );
      }
      return [...prev, toCheckoutItem(product, quantity)];
    });
  }, []);

  const openCheckoutFromCart = useCallback(() => {
    setChatCart((current) => {
      if (current.length === 0) return current;
      const first = current[0];
      setMessages((prev) => {
        const cleaned = prev.filter((m) => m.kind !== 'products' && m.kind !== 'checkout');
        return [
          ...cleaned,
          {
            id: `local-checkout-${Date.now()}`,
            text: 'Completa tus datos de facturación',
            isUser: false,
            timestamp: formatChatTime(),
            senderLabel: 'Facturación',
            kind: 'checkout',
            checkout: {
              productId: first.productId,
              productName: first.productName,
              price: first.price,
              quantity: first.quantity,
              image: first.image,
              items: current,
            },
          },
        ];
      });
      return current;
    });
  }, []);

  const handleCheckoutSubmit = useCallback(
    async (checkoutMsgId: string | number, values: CheckoutFormValues) => {
      if (!isAuthenticated) {
        setError('Debes iniciar sesión para completar la compra.');
        return;
      }
      if (values.items.length === 0) {
        setError('Agrega al menos un producto.');
        return;
      }

      setCheckoutSubmitting(true);
      setError(null);
      try {
        let sid = sessionId || localStorage.getItem(SESSION_KEY) || '';
        if (!sid) {
          const boot = await sendChatMessage({
            sessionId: '',
            message: `Quiero comprar ${values.items.map((i) => i.productName).join(', ')}`,
            customerId: resolvedCustomerId,
          });
          sid = boot.sessionId;
          setSessionId(sid);
          localStorage.setItem(SESSION_KEY, sid);
        }

        const paymentApi =
          values.paymentMethod === 'tarjeta'
            ? values.cardKind === 'debito'
              ? 'Debito'
              : 'Credito'
            : 'Efectivo';
        const result = await createSale({
          sessionId: sid,
          customerId: resolvedCustomerId ?? undefined,
          items: values.items.map((i) => ({
            productId: Number(i.productId),
            quantity: i.quantity,
          })),
          origin: 'Chatbot',
          paymentMethod: paymentApi,
          contactPhone: values.contactPhone,
          contactDocument: values.contactDocument,
          deliveryAddress: values.deliveryAddress,
        });

        if (!result.success) {
          setError(result.message || 'No se pudo completar la venta.');
          return;
        }

        const total =
          result.total ??
          values.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

        setChatCart([]);
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== checkoutMsgId && m.kind !== 'checkout'),
          {
            id: `invoice-${Date.now()}`,
            text: `Compra confirmada. Factura ${result.invoiceNumber || 'generada'}.`,
            isUser: false,
            timestamp: formatChatTime(),
            senderLabel: 'Sistema',
            kind: 'invoice',
            invoice: {
              number: result.invoiceNumber || 'N/A',
              total,
            },
          },
        ]);
      } catch (err) {
        setError(chatErrorMessage(err));
      } finally {
        setCheckoutSubmitting(false);
      }
    },
    [isAuthenticated, sessionId, resolvedCustomerId]
  );

  const requireLoginForAdvisor = useCallback(() => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + 1,
        text: 'Para hablar con un asesor necesitas una cuenta. Inicia sesión o regístrate.',
        isUser: false,
        timestamp: formatChatTime(),
        senderLabel: 'Sistema',
        kind: 'text',
      },
    ]);
    setError('Debes iniciar sesión para hablar con un asesor.');
    setChatState('NEED_LOGIN_FOR_AGENT');
  }, []);

  const connectToAdvisor = useCallback(
    async (userText: string) => {
      if (!isAuthenticated) {
        requireLoginForAdvisor();
        return;
      }

      const text = userText.trim();
      if (!text) return;

      setMessages((prev) => [
        ...prev,
        { id: `temp-${Date.now()}`, text, isUser: true, timestamp: formatChatTime(), kind: 'text' },
      ]);
      setMessage('');
      setSending(true);
      setError(null);

      try {
        let sid = sessionId || localStorage.getItem(SESSION_KEY) || '';

        if (!sid) {
          const result = await sendChatMessage({
            sessionId: '',
            message: text,
            customerId: resolvedCustomerId,
          });
          sid = result.sessionId;
          setSessionId(sid);
          localStorage.setItem(SESSION_KEY, sid);

          if (result.state === 'NEED_LOGIN_FOR_AGENT') {
            setChatState('NEED_LOGIN_FOR_AGENT');
            setError('Debes iniciar sesión para hablar con un asesor.');
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now() + 1,
                text: result.response,
                isUser: false,
                timestamp: formatChatTime(),
                senderLabel: 'Sistema',
                kind: 'text',
              },
            ]);
            return;
          }

          if (result.state === 'WAITING_HUMAN_AGENT') {
            setChatState('WAITING_HUMAN_AGENT');
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now() + 1,
                text: result.response || 'Te estoy conectando con un asesor. En un momento te atienden.',
                isUser: false,
                timestamp: formatChatTime(),
                senderLabel: 'Sistema',
                kind: 'text',
              },
            ]);
            return;
          }
        } else {
          try {
            const { startChatConnection: start, joinSession: join, sendMessageToSession } = await import(
              '../api/signalR'
            );
            await start();
            await join(sid);
            await sendMessageToSession(sid, text, 2);
          } catch (persistErr) {
            console.warn('No se pudo persistir el mensaje vía SignalR:', persistErr);
          }
        }

        await createEscalation(sid, 'Cliente solicitó hablar con un asesor desde el chat');
        setSessionId(sid);
        localStorage.setItem(SESSION_KEY, sid);
        setChatState('WAITING_HUMAN_AGENT');
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: 'Te estoy conectando con un asesor. En un momento te atienden.',
            isUser: false,
            timestamp: formatChatTime(),
            senderLabel: 'Sistema',
            kind: 'text',
          },
        ]);
      } catch (err: unknown) {
        setError(chatErrorMessage(err));
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 2,
            text: 'No pude conectar con un asesor ahora. Intenta de nuevo en un momento.',
            isUser: false,
            timestamp: formatChatTime(),
            senderLabel: 'Sistema',
            kind: 'text',
          },
        ]);
      } finally {
        setSending(false);
      }
    },
    [isAuthenticated, resolvedCustomerId, requireLoginForAdvisor, sessionId]
  );

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || sending) return;

      if (isBarePurchaseIntent(text) && chatState !== 'WAITING_HUMAN_AGENT') {
        setMessages((prev) => [
          ...prev,
          { id: `temp-${Date.now()}`, text, isUser: true, timestamp: formatChatTime(), kind: 'text' },
        ]);
        setMessage('');
        openProductPicker();
        return;
      }

      const lastBot = [...messages].reverse().find((m) => !m.isUser && m.kind !== 'products' && m.kind !== 'checkout');
      const botOfferedAdvisor = !!lastBot?.text.toLowerCase().includes('asesor');
      const requestingAdvisor =
        isExplicitAdvisorRequest(text) || (botOfferedAdvisor && isAffirmative(text));

      if (requestingAdvisor && !isAuthenticated) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now(), text, isUser: true, timestamp: formatChatTime(), kind: 'text' },
        ]);
        setMessage('');
        requireLoginForAdvisor();
        return;
      }

      if (requestingAdvisor && isAuthenticated) {
        await connectToAdvisor(text);
        return;
      }

      setMessages((prev) => [
        ...prev,
        { id: `temp-${Date.now()}`, text, isUser: true, timestamp: formatChatTime(), kind: 'text' },
      ]);
      setMessage('');
      setSending(true);
      setError(null);

      if (chatState === 'WAITING_HUMAN_AGENT' && signalRConnected && sessionId) {
        try {
          const { sendMessageToSession } = await import('../api/signalR');
          await sendMessageToSession(sessionId, text, 2);
        } catch (err) {
          setError(chatErrorMessage(err));
        } finally {
          setSending(false);
        }
        return;
      }

      try {
        const result = await sendChatMessage({
          sessionId: sessionId || '',
          message: text,
          customerId: resolvedCustomerId,
        });

        if (result.sessionId && result.sessionId !== sessionId) {
          setSessionId(result.sessionId);
          localStorage.setItem(SESSION_KEY, result.sessionId);
        }

        setChatState(result.state);

        const queryHint = extractSearchQuery(text);
        let productsFromBot = result.products ?? [];
        if (productsFromBot.length > 0 && queryHint) {
          productsFromBot = refineProductsByQuery(productsFromBot, queryHint);
        }
        const hasProducts = productsFromBot.length > 0;

        const botText = hasProducts && queryHint
          ? formatFoundProductsMessage(productsFromBot.length, queryHint)
          : sanitizeBotText(result.response || '', { hasProducts });

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: botText,
            isUser: false,
            timestamp: formatChatTime(),
            senderLabel: 'Killjoy Bot',
            kind: 'text',
          },
        ]);

        if (result.invoiceNumber) {
          setMessages((prev) => [
            ...prev,
            {
              id: `invoice-${Date.now()}`,
              text: `Factura generada: ${result.invoiceNumber}${result.saleOrigin ? ` · Origen: ${result.saleOrigin}` : ''}`,
              isUser: false,
              timestamp: formatChatTime(),
              senderLabel: 'Sistema',
              kind: 'invoice',
              invoice: { number: result.invoiceNumber!, total: null },
            },
          ]);
        }

        // Productos estructurados del bot → tarjetas
        if (hasProducts) {
          const seeded: ChatUiProduct[] = productsFromBot.map((p) => ({
            id: String(p.productId),
            name: p.name,
            price: p.price,
            stock: p.currentStock,
            image: resolveProductImageUrl(p.imageUrl),
            category: p.categoryName,
          }));
          openProductPicker(seeded);
        } else {
          // Fallback cliente: frases naturales ("quiero el lenovo...") sin products del bot
          const query = queryHint || extractSearchQuery(text);
          let seededFromClient = false;
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
                    if (!m.isUser && m.kind === 'text') {
                      next[i] = { ...m, text: successLine };
                      return next;
                    }
                  }
                  return [
                    ...next,
                    {
                      id: Date.now() + 11,
                      text: successLine,
                      isUser: false,
                      timestamp: formatChatTime(),
                      senderLabel: 'Killjoy Bot',
                      kind: 'text',
                    },
                  ];
                });
                openProductPicker(seeded);
                seededFromClient = true;
              }
            } catch {
              // ignore search fallback errors
            }
          }

          if (!seededFromClient) {
            const reply = (result.response || '').toLowerCase();
            if (
              (reply.includes('producto') || reply.includes('comprar') || reply.includes('stock')) &&
              (reply.includes('¿') || reply.includes('quieres') || reply.includes('te interesa'))
            ) {
              openProductPicker();
            }
          }
        }

        if (result.state === 'WAITING_HUMAN_AGENT') {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 2,
              text: 'Un asesor se unirá pronto a esta conversación.',
              isUser: false,
              timestamp: formatChatTime(),
              senderLabel: 'Sistema',
              kind: 'text',
            },
          ]);
        }

        if (result.state === 'NEED_LOGIN_FOR_AGENT') {
          if (isAuthenticated && (result.sessionId || sessionId)) {
            try {
              const sid = result.sessionId || sessionId;
              await createEscalation(sid, 'Reintento de escalación (cliente ya autenticado)');
              setSessionId(sid);
              localStorage.setItem(SESSION_KEY, sid);
              setChatState('WAITING_HUMAN_AGENT');
              setError(null);
              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now() + 3,
                  text: 'Te estoy conectando con un asesor. En un momento te atienden.',
                  isUser: false,
                  timestamp: formatChatTime(),
                  senderLabel: 'Sistema',
                  kind: 'text',
                },
              ]);
              return;
            } catch {
              // fallthrough
            }
          }
          setError('Debes iniciar sesión para hablar con un asesor.');
        }

        if (result.state === 'ERROR') {
          setError(result.response || 'El asistente no está disponible ahora.');
        }
      } catch (err: unknown) {
        setError(chatErrorMessage(err));
      } finally {
        setSending(false);
      }
    },
    [
      sending,
      sessionId,
      chatState,
      signalRConnected,
      isAuthenticated,
      requireLoginForAdvisor,
      resolvedCustomerId,
      messages,
      connectToAdvisor,
      openProductPicker,
    ]
  );

  const CLIP_CHAT =
    'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)';

  const statusLabel =
    chatState === 'WAITING_HUMAN_AGENT'
      ? signalRConnected
        ? 'Conectado con asesor'
        : 'Esperando asesor'
      : chatState === 'NEED_LOGIN_FOR_AGENT'
        ? 'Login requerido'
        : chatState === 'ERROR'
          ? 'Asistente no disponible'
          : 'En línea';

  const renderMessage = (msg: ClientChatMessage) => {
    if (msg.kind === 'products') {
      const seed = msg.products?.length ? msg.products : pickerSeed;
      return (
        <div key={msg.id} className="flex justify-start">
          <div className="w-full max-w-[95%]">
            <ChatProductPicker
              initialProducts={seed}
              cartCount={chatCart.length}
              onAdd={handleAddToCart}
              onCheckout={openCheckoutFromCart}
              onCancel={() => {
                setPickerSeed(undefined);
                setMessages((prev) => prev.filter((m) => m.id !== msg.id));
              }}
            />
          </div>
        </div>
      );
    }

    if (msg.kind === 'checkout' && msg.checkout) {
      const items =
        msg.checkout.items && msg.checkout.items.length > 0
          ? msg.checkout.items
          : [
              {
                productId: msg.checkout.productId,
                productName: msg.checkout.productName,
                price: msg.checkout.price,
                quantity: msg.checkout.quantity,
                image: msg.checkout.image,
              },
            ];
      return (
        <div key={msg.id} className="flex justify-start">
          <div className="w-full max-w-[95%]">
            <ChatCheckoutForm
              items={items}
              initialName={profilePrefill.name || user?.username || ''}
              initialPhone={profilePrefill.phone}
              initialDocument={profilePrefill.document}
              submitting={checkoutSubmitting}
              onAddMore={() => {
                setMessages((prev) => prev.filter((m) => m.id !== msg.id));
                openProductPicker();
              }}
              onCancel={() => setMessages((prev) => prev.filter((m) => m.id !== msg.id))}
              onSubmit={(values) => handleCheckoutSubmit(msg.id, values)}
            />
          </div>
        </div>
      );
    }

    if (msg.kind === 'invoice' && msg.invoice) {
      return (
        <div key={msg.id} className="flex justify-start">
          <div className="max-w-[90%] px-3 py-2 text-xs bg-[#00ece0]/10 border border-[#00ece0]/40 text-gray-200">
            <p className="text-[9px] text-[#00ece0] font-mono uppercase mb-1">Factura</p>
            <p className="font-bold text-white">{msg.invoice.number}</p>
            {msg.invoice.total != null && (
              <p className="text-[10px] font-mono text-gray-400 mt-0.5">
                Total {fmtCurrency(msg.invoice.total)}
              </p>
            )}
            <p className="text-[9px] mt-1 opacity-60 font-mono">{msg.timestamp}</p>
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => navigate('/facturas')}
                className="mt-2 text-[9px] font-mono uppercase text-[#00ece0] underline"
              >
                Ver mis facturas
              </button>
            )}
          </div>
        </div>
      );
    }

    if (!msg.text.trim()) return null;

    const bodyText = msg.isUser
      ? msg.text
      : sanitizeBotText(msg.text);
    const segments = msg.isUser
      ? [{ bold: false, text: bodyText }]
      : splitBoldSegments(bodyText);

    return (
      <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`max-w-[80%] min-w-0 overflow-hidden px-3 py-2 text-xs ${
            msg.isUser
              ? 'bg-[#ff4655] text-white'
              : 'bg-[#16191b] border border-gray-700 text-gray-300'
          }`}
        >
          {msg.senderLabel && (
            <p className="text-[9px] text-[#00ece0] mb-0.5 font-mono uppercase">{msg.senderLabel}</p>
          )}
          <p className="leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
            {segments.map((seg, i) =>
              seg.bold ? (
                <strong key={i} className="font-semibold text-white">
                  {seg.text}
                </strong>
              ) : (
                <span key={i}>{seg.text}</span>
              )
            )}
          </p>
          <p className="text-[9px] mt-1 opacity-60 font-mono">{msg.timestamp}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div
          className="w-80 sm:w-96 bg-[#1f2326] border border-gray-700 shadow-2xl shadow-black/50 flex flex-col transition-all duration-300"
          style={{
            clipPath: CLIP_CHAT,
            maxHeight: isMinimized ? '60px' : '560px',
          }}
        >
          <div className="bg-[#16191b] border-b border-gray-800 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#00ece0] rounded-full flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-[#0f1923]" />
              </div>
              <div>
                <h3 className="text-white text-sm font-bold font-mono uppercase tracking-wider">
                  Killjoy Bot
                </h3>
                <p className="text-[10px] text-[#00ece0] font-mono uppercase tracking-widest">
                  {statusLabel}
                </p>
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
              <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-96">
                {messages.map(renderMessage)}
                <div ref={bottomRef} />
              </div>

              {error && (
                <div className="mx-4 mb-2 text-[10px] text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-1.5 space-y-1">
                  <p>{error}</p>
                  {(chatState === 'NEED_LOGIN_FOR_AGENT' || error.includes('iniciar sesión')) && (
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      className="text-[#00ece0] underline font-mono uppercase"
                    >
                      Ir a iniciar sesión
                    </button>
                  )}
                </div>
              )}

              <div className="px-4 pb-2">
                <div className="flex flex-wrap gap-2">
                  {quickResponses.map((response) => (
                    <button
                      key={response}
                      onClick={() => handleSendMessage(response)}
                      disabled={sending || chatState === 'WAITING_HUMAN_AGENT'}
                      className="text-[10px] px-2 py-1 bg-[#16191b] border border-gray-700 text-gray-400 hover:border-[#00ece0] hover:text-[#00ece0] transition-colors font-mono uppercase disabled:opacity-50"
                    >
                      {response}
                    </button>
                  ))}
                </div>
              </div>

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
                    disabled={sending}
                    className="flex-1 px-3 py-2 bg-[#16191b] border border-gray-700 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-[#00ece0] focus:ring-1 focus:ring-[#00ece0] transition-all font-mono disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!message.trim() || sending}
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

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 bg-[#ff4655] hover:bg-[#e63e4c] text-white shadow-lg shadow-[#ff4655]/30 transition-all duration-300 flex items-center justify-center ${
          isOpen ? 'rotate-45' : 'hover:scale-110'
        }`}
        style={{
          clipPath:
            'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
        }}
        title={isOpen ? 'Cerrar chat' : 'Abrir soporte'}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
};
