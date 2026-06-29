import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { isFirebaseConfigured } from '@/firebase/config';
import { setStoreSource, type Source } from '@/services/store';

interface DataSourceContextType {
  source: Source;
  checked: boolean;
  label: string;
}

const DataSourceContext = createContext<DataSourceContextType>({
  source: 'local',
  checked: false,
  label: 'Local',
});

export function DataSourceProvider({ children }: { children: ReactNode }) {
  const [source, setSource] = useState<Source>('local');
  const [checked, setChecked] = useState(false);
  const [label, setLabel] = useState('Local');

  useEffect(() => {
    async function detect() {
      // 1. Check Firebase config first
      if (isFirebaseConfigured()) {
        setStoreSource('firebase');
        setSource('firebase');
        setLabel('Firebase');
        setChecked(true);
        return;
      }

      // 2. Check API server
      try {
        await fetch('/api/tables', { method: 'HEAD', signal: AbortSignal.timeout(2000) });
        setStoreSource('api');
        setSource('api');
        setLabel('Servidor local');
        setChecked(true);
        return;
      } catch {
        // No server available
      }

      // 3. Fallback to local storage
      setStoreSource('local');
      setSource('local');
      setLabel('Local (navegador)');
      setChecked(true);
    }

    detect();
  }, []);

  return (
    <DataSourceContext.Provider value={{ source, checked, label }}>
      {children}
    </DataSourceContext.Provider>
  );
}

export function useDataSource() {
  return useContext(DataSourceContext);
}
