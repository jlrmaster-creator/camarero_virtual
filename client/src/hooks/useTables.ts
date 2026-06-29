import { useState, useEffect, useCallback, useRef } from 'react';
import { onSnapshot, collection, query, where, orderBy, getDocs, type DocumentData } from 'firebase/firestore';
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
  [key: string]: unknown;
}

async function fetchActiveOccupations(companyId: string): Promise<Map<string, Occupation>> {
  const db = getDb();
  const ref = collection(db, 'companies', companyId, 'occupations');
  const q = query(ref, where('active', '==', true));
  const snap = await getDocs(q);
  const map = new Map<string, Occupation>();
  snap.docs.forEach(d => {
    const data = d.data() as Record<string, unknown>;
    const tableId = String(data.table_id);
    map.set(tableId, { id: d.id, ...data } as unknown as Occupation);
  });
  return map;
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
    const occMap = await fetchActiveOccupations(company.id);
    return rawTables.map(t => {
      const tid = String(t.id);
      const occupation = occMap.get(tid) ?? null;
      const waiterId = occupation?.waiter_id;
      const blocked = occupation !== null && currentWaiter !== null && waiterId !== null && waiterId !== undefined
        && waiterId !== currentWaiter.id;
      return {
        ...t,
        status: (t.status as string) ?? 'free',
        occupation,
        blocked_by_other: blocked,
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
        } catch {
          // fallback: show raw data
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Record<string, unknown>));
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
  }, [isFirebase, company?.id, zone, fetchTables, enrichWithOccupations]);

  useEffect(() => {
    if (isFirebase) return;
    const interval = setInterval(fetchTables, 5000);
    return () => clearInterval(interval);
  }, [isFirebase, fetchTables]);

  return { tables, loading, error, refetch: fetchTables };
}

export type { TableWithMeta };
