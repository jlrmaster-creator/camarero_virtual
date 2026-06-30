import { useNavigate } from 'react-router-dom';
import type { TableWithMeta } from '@/hooks/useTables';

interface TableCardProps {
  table: TableWithMeta;
  disabled?: boolean;
}

const WAITER_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
  '#f59e0b', '#06b6d4', '#84cc16', '#f97316',
];

function waiterColor(id: number): string {
  return WAITER_COLORS[((id * 7) % WAITER_COLORS.length + WAITER_COLORS.length) % WAITER_COLORS.length];
}

function statusColor(table: TableWithMeta): string {
  if (table.blocked_by_other) return 'bg-purple-600';
  switch (table.status) {
    case 'free': return 'bg-green-500';
    case 'occupied': return 'bg-red-500';
    case 'pending_payment': return 'bg-amber-500';
    case 'partial': return 'bg-orange-500';
    case 'paid': return 'bg-gray-500';
    default: return 'bg-gray-400';
  }
}

function zoneBorder(table: TableWithMeta): string {
  return table.zone === 'interior' ? 'border-t-4 border-blue-400' : 'border-t-4 border-amber-400';
}

export function TableCard({ table, disabled }: TableCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={disabled ? undefined : () => navigate(`/tables/${table.id}`, { state: { zone: table.zone } })}
      className={`
        relative flex flex-col items-center justify-center p-3 rounded-xl
        text-white font-bold shadow-md transition-transform
        min-h-[80px] ${statusColor(table)} ${zoneBorder(table)}
        ${disabled ? 'opacity-75 cursor-not-allowed' : 'active:scale-95 cursor-pointer'}
      `}
    >
      {table.waiter_id != null && (
        <span
          className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-full"
          style={{ backgroundColor: waiterColor(table.waiter_id) }}
        />
      )}
      <span className="text-lg leading-tight">{table.nombre?.replace(/^Mesa\s*/, '') || String(table.numero)}</span>
      {table.occupation && (
        <span className="text-xs mt-1 opacity-90 flex flex-col items-center">
          <span>{table.occupation.comensales} com.s · {table.waiter_nombre || '?'}</span>
          {table.occupation.total > 0 && (
            <span className="font-semibold">{table.occupation.total.toFixed(2)}€</span>
          )}
        </span>
      )}
      {!table.occupation && table.waiter_nombre && (
        <span className="text-xs mt-1 opacity-80">{table.waiter_nombre}</span>
      )}
      {table.blocked_by_other && (
        <span className="text-[10px] mt-0.5 opacity-80">Bloqueada</span>
      )}
      <span className="absolute top-1 right-1 text-[10px] opacity-60">
        {table.zone === 'interior' ? 'INT' : 'TER'}
      </span>
    </button>
  );
}
