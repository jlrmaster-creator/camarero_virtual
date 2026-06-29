import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { store, getStoreSource } from '@/services/store';
import { useAuth } from '@/context/AuthContext';
import type { Waiter } from '@/types/models';

interface WaiterContextType {
  currentWaiter: Waiter | null;
  setCurrentWaiter: (waiter: Waiter | null) => void;
  activeWaiters: Waiter[];
  refresh: () => Promise<void>;
}

const WaiterContext = createContext<WaiterContextType | null>(null);

export function WaiterProvider({ children }: { children: ReactNode }) {
  const [currentWaiter, setCurrentWaiter] = useState<Waiter | null>(null);
  const [activeWaiters, setActiveWaiters] = useState<Waiter[]>([]);
  const { user, company } = useAuth();
  const prevUidRef = useRef<string | null>(null);

  // Reset currentWaiter when the Firebase user changes (logout / login)
  const currentUid = user?.uid ?? null;
  if (currentUid !== prevUidRef.current) {
    if (prevUidRef.current !== null) {
      setCurrentWaiter(null);
    }
    prevUidRef.current = currentUid;
  }

  const refresh = async () => {
    try {
      const source = getStoreSource();
      if (source !== 'firebase' || !company) {
        setActiveWaiters([]);
        return;
      }
      
      const allWaiters = await store.getWaiters(false);
      const active = allWaiters.filter(w => w.activo);
      setActiveWaiters(active);

      if (user) {
        const me = allWaiters.find(w => w.auth_uid === user.uid);
        if (me && me.activo) {
          setCurrentWaiter(me);
        } else if (me && !me.activo) {
          setCurrentWaiter(null);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    refresh();
  }, [user?.uid, company?.id]);

  return (
    <WaiterContext.Provider value={{ currentWaiter, setCurrentWaiter, activeWaiters, refresh }}>
      {children}
    </WaiterContext.Provider>
  );
}

export function useWaiter() {
  const ctx = useContext(WaiterContext);
  if (!ctx) throw new Error('useWaiter must be used within WaiterProvider');
  return ctx;
}