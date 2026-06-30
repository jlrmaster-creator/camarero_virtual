import { useAuth } from '@/context/AuthContext';
import { useWaiter } from '@/context/WaiterContext';
import { TableCard } from './TableCard';
import type { TableWithMeta } from '@/hooks/useTables';

interface TableGridProps {
  tables: TableWithMeta[];
  loading: boolean;
  error: string | null;
}

export function TableGrid({ tables, loading, error }: TableGridProps) {
  const { role } = useAuth();
  const { currentWaiter } = useWaiter();
  const waiterInactive = role === 'waiter' && !currentWaiter;

  const visibleTables = (role === 'waiter' && currentWaiter)
    ? tables.filter(t => t.waiter_id === currentWaiter.id)
    : tables;

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
    <div className="space-y-3">
      {waiterInactive && (
        <div className="bg-yellow-900/50 text-yellow-300 px-4 py-3 rounded-lg text-sm text-center">
          No tienes un turno activo. Pide a un administrador que active tu turno para poder gestionar mesas.
        </div>
      )}
      {visibleTables.length === 0 && !loading && (
        <div className="text-center py-8 text-slate-500">
          {role === 'waiter' && currentWaiter
            ? 'No tienes mesas asignadas en esta zona.'
            : 'No hay mesas disponibles en esta zona.'}
        </div>
      )}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {visibleTables.map(table => (
          <TableCard key={table.id} table={table} disabled={waiterInactive} />
        ))}
      </div>
    </div>
  );
}
