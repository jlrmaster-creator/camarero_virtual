import { useState, useEffect } from 'react';
import {
  collection,
  query,
  onSnapshot,
  type QueryConstraint,
} from 'firebase/firestore';
import { getDb } from '@/firebase/init';

export function useRealtimeCollection<T>(
  path: string,
  ...constraints: QueryConstraint[]
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = getDb();
    const ref = collection(db, path);
    const q = constraints.length > 0 ? query(ref, ...constraints) : ref;

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as unknown as T));
        setData(docs);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );

    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  return { data, loading, error };
}

export function useRealtimeCompanyCollection<T>(
  companyId: string | null,
  collectionName: string,
  ...constraints: QueryConstraint[]
) {
  const path = companyId ? `companies/${companyId}/${collectionName}` : '';
  return useRealtimeCollection<T>(path, ...constraints);
}
