import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { store } from '@/services/store';
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

  const refresh = async () => {
    try {
      const waiters = await store.getWaiters(true);
      setActiveWaiters(waiters);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    refresh();
  }, []);

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
