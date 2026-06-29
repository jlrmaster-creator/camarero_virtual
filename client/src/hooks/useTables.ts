import { useState, useEffect, useCallback } from 'react';
import { store } from '@/services/store';
import type { Zone } from '@/types/models';

export function useTables(zone: Zone = 'interior') {
  const [tables, setTables] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      const data = await store.getTables(zone);
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
