import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { Headphones, X } from 'lucide-react';
import { useAuth } from './AuthContext';
import { getPendingEscalations } from '../api/chatEscalationApi';
import {
  startChatConnection,
  joinAsAdvisor,
  onNewEscalation,
  offNewEscalation,
  type ChatEscalationNotification,
} from '../api/signalR';

interface AdvisorAlertContextType {
  pendingCount: number;
  refreshPending: () => Promise<void>;
  clearToast: () => void;
  latestToast: ChatEscalationNotification | null;
}

const AdvisorAlertContext = createContext<AdvisorAlertContextType | undefined>(undefined);

function isStaffRole(role: string | undefined): boolean {
  const r = role?.toLowerCase() ?? '';
  return r === 'admin' || r === 'asesor' || r === 'operator';
}

export const AdvisorAlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [latestToast, setLatestToast] = useState<ChatEscalationNotification | null>(null);

  const refreshPending = useCallback(async () => {
    if (!isAuthenticated || !isStaffRole(user?.role)) {
      setPendingCount(0);
      return;
    }
    try {
      const data = await getPendingEscalations();
      setPendingCount(data.length);
    } catch {
      // silencioso: el badge no es critico
    }
  }, [isAuthenticated, user?.role]);

  const clearToast = useCallback(() => setLatestToast(null), []);

  useEffect(() => {
    if (!isAuthenticated || !token || !isStaffRole(user?.role)) return;

    let active = true;

    const handleNew = (esc: ChatEscalationNotification) => {
      if (!active) return;
      setPendingCount((n) => n + 1);
      setLatestToast(esc);
      window.setTimeout(() => {
        setLatestToast((current) =>
          current?.chatEscalationId === esc.chatEscalationId ? null : current
        );
      }, 12000);
    };

    (async () => {
      try {
        await startChatConnection();
        await joinAsAdvisor();
        onNewEscalation(handleNew);
        if (active) await refreshPending();
      } catch (err) {
        console.error('AdvisorAlert SignalR:', err);
      }
    })();

    return () => {
      active = false;
      offNewEscalation(handleNew);
    };
  }, [isAuthenticated, token, user?.role, refreshPending]);

  useEffect(() => {
    if (!isAuthenticated || !isStaffRole(user?.role)) {
      setPendingCount(0);
      setLatestToast(null);
    }
  }, [isAuthenticated, user?.role]);

  return (
    <AdvisorAlertContext.Provider
      value={{ pendingCount, refreshPending, clearToast, latestToast }}
    >
      {children}
      {latestToast && isStaffRole(user?.role) && (
        <AdvisorToast escalation={latestToast} onClose={clearToast} />
      )}
    </AdvisorAlertContext.Provider>
  );
};

function AdvisorToast({
  escalation,
  onClose,
}: {
  escalation: ChatEscalationNotification;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const name = escalation.customerName || 'Cliente';

  return (
    <div className="fixed bottom-6 right-6 z-[60] w-80 max-w-[calc(100vw-2rem)] bg-[#16191b] border border-[#00ece0]/50 shadow-2xl shadow-black/50 p-4 font-mono">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-[#00ece0]/15 border border-[#00ece0]/40 flex items-center justify-center shrink-0">
          <Headphones className="w-4 h-4 text-[#00ece0]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-[#00ece0] uppercase tracking-widest mb-1">
            Nuevo chat · Soporte
          </p>
          <p className="text-white text-sm font-bold truncate">{name}</p>
          <p className="text-gray-400 text-xs mt-1 line-clamp-2">
            {escalation.reason || 'Solicita hablar con un asesor'}
          </p>
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/support');
            }}
            className="mt-3 w-full px-3 py-2 text-[10px] font-bold uppercase tracking-wider bg-[#00ece0] text-[#0f1923] hover:bg-[#00d4ce] transition-colors"
          >
            Abrir soporte
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-500 hover:text-white p-0.5"
          title="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export const useAdvisorAlerts = () => {
  const ctx = useContext(AdvisorAlertContext);
  if (!ctx) {
    throw new Error('useAdvisorAlerts debe usarse dentro de AdvisorAlertProvider');
  }
  return ctx;
};
