import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '@/services/api';
import type { Session } from '@/types/models';

interface SessionContextType {
  session: Session | null;
  loading: boolean;
  createSession: () => Promise<Session>;
  joinSession: (codigo: string) => Promise<Session>;
  leaveSession: () => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

const STORAGE_KEY = 'camarero_session';

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(session: Session | null): void {
  if (session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(loadSession);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    saveSession(session);
  }, [session]);

  const createSession = async () => {
    setLoading(true);
    try {
      const s = await api.post<Session>('/sessions', {});
      setSession(s);
      return s;
    } finally {
      setLoading(false);
    }
  };

  const joinSession = async (codigo: string) => {
    setLoading(true);
    try {
      const s = await api.post<Session>('/sessions', { codigo });
      setSession(s);
      return s;
    } finally {
      setLoading(false);
    }
  };

  const leaveSession = () => {
    setSession(null);
  };

  return (
    <SessionContext.Provider value={{ session, loading, createSession, joinSession, leaveSession }}>
      {children}
    </SessionContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
