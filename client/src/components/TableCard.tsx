import { useNavigate } from 'react-router-dom';
import type { TableWithMeta } from '@/hooks/useTables';

interface TableCardProps {
  table: TableWithMeta;
  disabled?: boolean;
}

function statusColor(table: TableWithMeta): string {
  if (table.blocked_by_other) return 'bg-purple-600';
  switch (table.status) {
    case 'free': return 'bg-green-500';
    case 'occupied': return 'bg-red-500';
    case 'pending_payment': return 'bg-amber-500';
    case 'partial': return 'bg-orange-500';
    case 'paid': return 'bg-slate-500';
    default: return 'bg-gray-400';
  }
}

function zoneBorder(table: TableWithMeta): string {
  return table.zone === 'interior' ? 'border-t-4 border-blue-400' : 'border-t-4 border-amber-400';
}

export function TableCard({ table, disabled }: TableCardProps) {
  const navigate = useNavigate();

  const occ = table.occupation;
  const ultimo = table.ultimo_servicio as { cliente: string; total: number; comensales: number } | undefined;
  const showData = occ || (table.status === 'paid' && ultimo);

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
      <span className="text-lg leading-tight">{table.nombre?.replace(/^Mesa\s*/, '') || String(table.numero)}</span>

      {showData && (
        <span className="text-xs mt-1 opacity-90 flex flex-col items-center">
          {occ?.cliente || ultimo?.cliente ? (
            <span className="truncate max-w-[90px]">{occ?.cliente || ultimo?.cliente}</span>
          ) : null}
          <span>
            {(occ?.comensales ?? ultimo?.comensales ?? 0)} com. · {(occ?.total ?? ultimo?.total ?? 0).toFixed(2)}€
          </span>
        </span>
      )}

      {table.status === 'paid' && (
        <span className="absolute top-1 right-1 text-xs bg-white/20 rounded-full px-1.5 py-0.5">
          ✓ Pagado
        </span>
      )}

      {table.blocked_by_other && (
        <span className="text-[10px] mt-0.5 opacity-80">Bloqueada</span>
      )}

      <span className="absolute top-1 left-1 text-[10px] opacity-60">
        {table.zone === 'interior' ? 'INT' : 'TER'}
      </span>
    </button>
  );
}
