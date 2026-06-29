import { useState, useEffect, useCallback } from 'react';
import { tablesService, type TableWithOccupation } from '@/services/tables';
import type { Zone } from '@/types/models';

export function useTables(zone: Zone = 'interior') {
  const [tables, setTables] = useState<TableWithOccupation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      const data = await tablesService.getAll(zone);
      setTables(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading tables');
    } finally {
      setLoading(false);
    }
  }, [zone]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  return { tables, loading, error, refetch: fetchTables };
}
