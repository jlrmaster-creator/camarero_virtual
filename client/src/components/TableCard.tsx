import type { TableWithOccupation } from '@/services/tables';
import { useNavigate } from 'react-router-dom';

interface TableCardProps {
  table: TableWithOccupation;
}

const statusColors: Record<string, string> = {
  free: 'bg-green-500',
  occupied: 'bg-red-500',
  pending_payment: 'bg-amber-500',
  partial: 'bg-orange-500',
  paid: 'bg-gray-500',
};

export function TableCard({ table }: TableCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/tables/${table.id}`)}
      className={`
        relative flex flex-col items-center justify-center p-3 rounded-xl
        text-white font-bold shadow-md active:scale-95 transition-transform
        min-h-[80px] ${statusColors[table.status] ?? 'bg-gray-400'}
      `}
    >
      <span className="text-lg leading-tight">{table.nombre || `Mesa ${table.numero}`}</span>
      {table.occupation && (
        <span className="text-xs mt-1 opacity-90">
          {table.occupation.comensales} com.s
        </span>
      )}
    </button>
  );
}
