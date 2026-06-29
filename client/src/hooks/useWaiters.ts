import { useState, useEffect, useCallback } from 'react';
import { store } from '@/services/store';
import { useDataSource } from '@/context/DataSourceContext';
import type { Waiter } from '@/types/models';

export function useWaiters() {
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [loading, setLoading] = useState(true);
  const { checked } = useDataSource();

  const fetch = useCallback(async () => {
    if (!checked) return;
    try {
      const data = await store.getWaiters();
      setWaiters(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [checked]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const createWaiter = async (nombre: string) => {
    const w = await store.createWaiter(nombre);
    await fetch();
    return w;
  };

  const startShift = async (id: number) => {
    const w = await store.startWaiterShift(id);
    await fetch();
    return w;
  };

  const endShift = async (id: number) => {
    const w = await store.endWaiterShift(id);
    await fetch();
    return w;
  };

  return { waiters, loading, createWaiter, startShift, endShift, refetch: fetch };
}
