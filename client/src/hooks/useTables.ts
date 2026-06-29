import { useState, useEffect, useCallback, useRef } from 'react';
import { onSnapshot, collection, query, where, orderBy, type DocumentData } from 'firebase/firestore';
import { store, getStoreSource } from '@/services/store';
import { getDb } from '@/firebase/init';
import { useAuth } from '@/context/AuthContext';
import type { Zone } from '@/types/models';

export function useTables(zone: Zone = 'interior') {
  const [tables, setTables] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { company } = useAuth();
  const source = getStoreSource();
  const isFirebase = source === 'firebase';
  const unsubRef = useRef<(() => void) | null>(null);

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
    // Always fetch first (seeds defaults if empty)
    fetchTables();

    if (!isFirebase || !company) return;

    // Firebase mode: also subscribe to real-time updates
    const db = getDb();
    const ref = collection(db, 'companies', company.id, 'tables');
    const q = query(ref, where('zone', '==', zone), orderBy('numero'));

    unsubRef.current = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Record<string, unknown>));
        setTables(docs);
        setLoading(false);
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
  }, [isFirebase, company?.id, zone, fetchTables]);

  // Polling fallback for non-Firebase mode — refresh every 5s
  useEffect(() => {
    if (isFirebase) return;
    const interval = setInterval(fetchTables, 5000);
    return () => clearInterval(interval);
  }, [isFirebase, fetchTables]);

  return { tables, loading, error, refetch: fetchTables };
}
