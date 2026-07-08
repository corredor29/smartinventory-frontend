import type { OrderStatus } from '../types/order';

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  confirmado: {
    label: 'Confirmado',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  },
  en_proceso: {
    label: 'En proceso',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  },
  entregado: {
    label: 'Entregado',
    className: 'bg-[#00ece0]/10 text-[#00ece0] border-[#00ece0]/30',
  },
  cancelado: {
    label: 'Cancelado',
    className: 'bg-[#ff4655]/10 text-[#ff4655] border-[#ff4655]/30',
  },
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-block text-[9px] font-mono uppercase tracking-widest px-2 py-1 border ${config.className}`}
    >
      {config.label}
    </span>
  );
}
