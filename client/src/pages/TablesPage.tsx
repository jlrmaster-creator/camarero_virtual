import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ZoneTabs } from '@/components/ZoneTabs';
import { TableGrid } from '@/components/TableGrid';
import { useTables } from '@/hooks/useTables';
import type { Zone } from '@/types/models';

export function TablesPage() {
  const location = useLocation();
  const initialZone: Zone = (location.state as { zone?: Zone })?.zone ?? 'interior';
  const [zone, setZone] = useState<Zone>(initialZone);
  const { tables, loading, error } = useTables(zone);

  return (
    <div>
      <ZoneTabs active={zone} onChange={z => setZone(z)} />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">
          {zone === 'interior' ? 'Interior' : 'Terraza'}
        </h1>
      </div>
      <TableGrid tables={tables} loading={loading} error={error} />
    </div>
  );
}
