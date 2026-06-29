import type { TableWithOccupation } from '@/services/tables';
import { TableCard } from './TableCard';

interface TableGridProps {
  tables: TableWithOccupation[];
  loading: boolean;
  error: string | null;
}

export function TableGrid({ tables, loading, error }: TableGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="rounded-xl min-h-[80px] bg-slate-200 dark:bg-slate-700 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
      {tables.map(table => (
        <TableCard key={table.id} table={table} />
      ))}
    </div>
  );
}
