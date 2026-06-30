import { useNavigate } from 'react-router-dom';
import type { TableWithMeta } from '@/hooks/useTables';
import type { GrupoPedido } from '@/types/models';

interface TableCardProps {
  table: TableWithMeta;
  disabled?: boolean;
}

interface UltimoServicio {
  cliente?: string;
  total?: number;
  comensales?: number;
  grupos?: GrupoPedido[];
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

function grupoTotal(grupo: GrupoPedido): number {
  return grupo.items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
}

export function TableCard({ table, disabled }: TableCardProps) {
  const navigate = useNavigate();

  const occ = table.occupation;
  const ultimo = table.ultimo_servicio as UltimoServicio | undefined;
  const showData = occ || (table.status === 'paid' && ultimo);

  const occGrupos = occ?.grupos as GrupoPedido[] | undefined;
  const ultimoGrupos = ultimo?.grupos as GrupoPedido[] | undefined;
  const grupos = occGrupos || ultimoGrupos;

  const displayName = grupos && grupos.length > 0
    ? grupos.map(g => g.nombre).join(' + ')
    : occ?.cliente || ultimo?.cliente || '';

  const totalCom = grupos
    ? grupos.reduce((s, g) => s + g.comensales, 0)
    : (occ?.comensales ?? ultimo?.comensales ?? 0);

  const displayTotal = grupos
    ? grupos.reduce((s, g) => s + grupoTotal(g), 0)
    : (occ?.total ?? ultimo?.total ?? 0);

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
          {displayName && (
            <span className="truncate max-w-[90px]">{displayName}</span>
          )}
          <span>
            {totalCom} com. · {displayTotal.toFixed(2)}€
          </span>
        </span>
      )}

      {table.status === 'paid' && (
        <span className="absolute top-1 right-1 text-blue-500 text-sm font-bold drop-shadow-md">
          ✓
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
