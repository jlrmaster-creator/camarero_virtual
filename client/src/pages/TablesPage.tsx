import { useState } from 'react';
import { ZoneTabs } from '@/components/ZoneTabs';
import { TableGrid } from '@/components/TableGrid';
import { useTables } from '@/hooks/useTables';
import type { Zone } from '@/types/models';
import type { TableWithOccupation } from '@/services/tables';

export function TablesPage() {
  const [zone, setZone] = useState<Zone>('interior');
  const { tables, loading, error, refetch } = useTables(zone);

  return (
    <div>
      <ZoneTabs active={zone} onChange={z => setZone(z)} />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">
          {zone === 'interior' ? 'Interior' : 'Terraza'}
        </h1>
        <button onClick={() => refetch()} className="btn-primary text-sm">
          Actualizar
        </button>
      </div>
      <TableGrid tables={tables as unknown as TableWithOccupation[]} loading={loading} error={error} />
    </div>
  );
}
