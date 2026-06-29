import { TableCard } from './TableCard';
import type { TableWithMeta } from '@/hooks/useTables';

interface TableGridProps {
  tables: TableWithMeta[];
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
    const isOffline = error.includes('Servidor no disponible') || error.includes('conectar con el servidor');
    return (
      <div className={`text-center py-8 ${isOffline ? 'text-amber-500' : 'text-red-500'}`}>
        <p className="text-lg font-semibold mb-2">
          {isOffline ? '🔌 Servidor no disponible' : 'Error'}
        </p>
        <p className="text-sm opacity-80">
          {isOffline
            ? 'La aplicación está en modo vista. Conecta el servidor backend para usar todas las funciones.'
            : error}
        </p>
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
