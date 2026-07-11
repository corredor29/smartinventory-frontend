import React from 'react';
import { Headphones, CheckCircle, UserPlus } from 'lucide-react';
import type { ChatEscalationDto } from '../../api/chatEscalationApi';

interface EscalationPanelProps {
  escalations: ChatEscalationDto[];
  loading?: boolean;
  error?: string | null;
  selectedId?: number | null;
  onSelect: (escalation: ChatEscalationDto) => void;
  onAssign: (escalation: ChatEscalationDto) => void;
  onResolve: (escalation: ChatEscalationDto) => void;
  assigningId?: number | null;
  resolvingId?: number | null;
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export const EscalationPanel: React.FC<EscalationPanelProps> = ({
  escalations,
  loading = false,
  error,
  selectedId,
  onSelect,
  onAssign,
  onResolve,
  assigningId,
  resolvingId,
}) => {
  return (
    <div className="bg-[#16191b] border border-gray-800 flex flex-col h-full min-h-0">
      <div className="p-4 border-b border-gray-800 flex items-center gap-2">
        <Headphones className="w-4 h-4 text-[#00ece0]" />
        <h2 className="text-white text-sm font-bold uppercase tracking-wider font-mono">
          Tickets pendientes
        </h2>
        <span className="ml-auto text-[10px] font-mono text-gray-500">
          {escalations.length}
        </span>
      </div>

      {error && (
        <div className="m-3 text-xs text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {loading ? (
          <div className="text-center py-8 text-gray-500 text-xs font-mono">Cargando...</div>
        ) : escalations.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-xs font-mono uppercase tracking-wider">
            Sin escalamientos pendientes
          </div>
        ) : (
          escalations.map((esc) => {
            const isSelected = selectedId === esc.chatEscalationId;
            return (
              <div
                key={esc.chatEscalationId}
                onClick={() => onSelect(esc)}
                className={`p-3 border cursor-pointer transition-colors ${
                  isSelected
                    ? 'border-[#00ece0] bg-[#00ece0]/5'
                    : 'border-gray-800 bg-[#0d1117] hover:border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-bold text-white font-mono tracking-wide">
                      {esc.customerName || 'Cliente sin nombre'}
                    </p>
                    <span className="text-[10px] font-mono text-[#00ece0] uppercase tracking-wider">
                      Sesión #{esc.chatSessionId}
                    </span>
                    <p className="text-xs text-gray-300 mt-1 line-clamp-2">
                      {esc.reason || 'Sin motivo especificado'}
                    </p>
                  </div>
                  <span className="text-[9px] font-mono text-gray-500 shrink-0">
                    {fmtDate(esc.createdAt)}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[9px] px-1.5 py-0.5 bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/30 uppercase font-mono">
                    {esc.statusName}
                  </span>
                  {esc.assignedUserName && (
                    <span className="text-[9px] text-gray-500 font-mono truncate">
                      {esc.assignedUserName}
                    </span>
                  )}
                </div>

                <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onAssign(esc)}
                    disabled={assigningId === esc.chatEscalationId || !!esc.assignedUserName}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-[#00ece0]/10 text-[#00ece0] border border-[#00ece0]/30 hover:bg-[#00ece0]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <UserPlus className="w-3 h-3" />
                    {esc.assignedUserName ? 'Asignado' : assigningId === esc.chatEscalationId ? '...' : 'Tomar'}
                  </button>
                  <button
                    onClick={() => onResolve(esc)}
                    disabled={resolvingId === esc.chatEscalationId}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-[#ff4655]/10 text-[#ff4655] border border-[#ff4655]/30 hover:bg-[#ff4655]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <CheckCircle className="w-3 h-3" />
                    {resolvingId === esc.chatEscalationId ? '...' : 'Resolver'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default EscalationPanel;
