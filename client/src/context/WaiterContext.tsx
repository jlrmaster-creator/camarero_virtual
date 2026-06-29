import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
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

  const refresh = async () => {
    try {
      const source = getStoreSource();
      if (source !== 'firebase') {
        setActiveWaiters([]);
        return;
      }
      const waiters = await store.getWaiters(true);
      setActiveWaiters(waiters);

      // If admin is not yet in the waiters list as active, they can start
      // as a waiter too (handled in WaiterPage UI)
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
