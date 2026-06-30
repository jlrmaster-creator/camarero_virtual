import { useState, useEffect, useCallback, useRef } from 'react';
import { onSnapshot, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { store, getStoreSource } from '@/services/store';
import { getDb } from '@/firebase/init';
import { useAuth } from '@/context/AuthContext';
import { useWaiter } from '@/context/WaiterContext';
import type { Zone, Occupation } from '@/types/models';

interface TableWithMeta {
  id: string;
  zone: string;
  numero: number;
  nombre: string;
  status: string;
  occupation: Occupation | null;
  blocked_by_other: boolean;
  waiter_id: number | null;
  waiter_nombre: string | null;
  [key: string]: unknown;
}

async function fetchActiveOccupations(companyId: string): Promise<Map<string, Occupation>> {
  const db = getDb();
  const ref = collection(db, 'companies', companyId, 'occupations');
  const q = query(ref, where('active', '==', true));
    try {
      const snap = await getDocs(q);
      const map = new Map<string, Occupation>();
      snap.docs.forEach(d => {
        const data = d.data() as Record<string, unknown>;
        const tableId = String(data.table_id);
        map.set(tableId, { id: d.id, ...data } as unknown as Occupation);
      });
      return map;
    } catch (e) {
      console.error('[useTables] fetchActiveOccupations failed:', e);
      throw e;
    }
}

export function useTables(zone: Zone = 'interior') {
  const [tables, setTables] = useState<TableWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { company } = useAuth();
  const { currentWaiter } = useWaiter();
  const source = getStoreSource();
  const isFirebase = source === 'firebase';
  const unsubRef = useRef<(() => void) | null>(null);

  const enrichWithOccupations = useCallback(async (rawTables: Record<string, unknown>[]) => {
    if (!company) return rawTables as TableWithMeta[];
    const [occMap, waiters] = await Promise.all([
      fetchActiveOccupations(company.id),
      store.getWaiters(),
    ]);
    const waiterMap = new Map<number, string>();
    const tableAssignmentMap = new Map<number, number>();
    for (const w of waiters) {
      waiterMap.set(w.id, w.nombre);
      if (w.assigned_table_ids) {
        for (const tid of w.assigned_table_ids) {
          tableAssignmentMap.set(tid, w.id);
        }
      }
    }
    return rawTables.map(t => {
      const tid = String(t.id);
      const tableDocId = parseInt(tid, 10);
      const occupation = occMap.get(tid) ?? null;
      const assignedWaiterId = tableDocId ? (tableAssignmentMap.get(tableDocId) ?? null) : null;
      const occWaiterId = occupation?.waiter_id;
      const resolveWaiterId = occWaiterId ?? assignedWaiterId;
      const occupiedByOther = occupation !== null && occWaiterId !== null && occWaiterId !== undefined
        && currentWaiter !== null && occWaiterId !== currentWaiter.id;
      const assignedToOther = occupation === null && assignedWaiterId !== null
        && currentWaiter !== null && assignedWaiterId !== currentWaiter.id;
      const blocked = occupiedByOther || assignedToOther;
      return {
        ...t,
        status: (t.status as string) ?? 'free',
        occupation,
        waiter_id: resolveWaiterId,
        blocked_by_other: blocked,
        waiter_nombre: resolveWaiterId ? (waiterMap.get(resolveWaiterId) ?? null) : null,
      } as TableWithMeta;
    });
  }, [company, currentWaiter]);

  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      const raw = await store.getTables(zone);
      const enriched = await enrichWithOccupations(raw);
      setTables(enriched);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading tables');
    } finally {
      setLoading(false);
    }
  }, [zone, enrichWithOccupations]);

  useEffect(() => {
    if (!isFirebase) {
      fetchTables();
      return;
    }

    if (!company) return;

    fetchTables();

    const db = getDb();
    const ref = collection(db, 'companies', company.id, 'tables');
    const q = query(ref, where('zone', '==', zone), orderBy('numero'));

    unsubRef.current = onSnapshot(
      q,
      async (snap) => {
        try {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Record<string, unknown>));
          const enriched = await enrichWithOccupations(docs);
          setTables(enriched);
        }       catch (err) {
          console.error('useTables enrich error', err);
          const docs = snap.docs.map(d => ({
            id: d.id,
            ...d.data(),
            status: (d.data() as Record<string, unknown>)?.status ?? 'free',
            occupation: null,
            blocked_by_other: false,
            waiter_id: null,
            waiter_nombre: null,
          } as Record<string, unknown>));
          setTables(docs as TableWithMeta[]);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFirebase, company?.id, zone, fetchTables, enrichWithOccupations]);

  useEffect(() => {
    if (isFirebase) return;
    const interval = setInterval(fetchTables, 5000);
    return () => clearInterval(interval);
  }, [isFirebase, fetchTables]);

  return { tables, loading, error, refetch: fetchTables };
}

export type { TableWithMeta };
