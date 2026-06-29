import { useNavigate } from 'react-router-dom';
import type { TableWithMeta } from '@/hooks/useTables';

interface TableCardProps {
  table: TableWithMeta;
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

export function TableCard({ table }: TableCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/tables/${table.id}`)}
      className={`
        relative flex flex-col items-center justify-center p-3 rounded-xl
        text-white font-bold shadow-md active:scale-95 transition-transform
        min-h-[80px] ${statusColor(table)}
      `}
    >
      <span className="text-lg leading-tight">{table.nombre || `Mesa ${table.numero}`}</span>
      {table.occupation && (
        <span className="text-xs mt-1 opacity-90">
          {table.occupation.comensales} com.s
          {table.occupation.waiter_id && <span className="ml-1">· M{String(table.occupation.waiter_id).slice(0, 4)}</span>}
        </span>
      )}
      {table.blocked_by_other && (
        <span className="text-[10px] mt-0.5 opacity-80">Bloqueada</span>
      )}
    </button>
  );
}
