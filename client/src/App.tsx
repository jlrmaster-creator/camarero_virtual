import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SessionProvider, useSession } from '@/context/SessionContext';
import { WaiterProvider } from '@/context/WaiterContext';
import { Layout } from '@/components/Layout';
import { SessionPage } from '@/pages/SessionPage';
import { TablesPage } from '@/pages/TablesPage';
import { TableDetailPage } from '@/pages/TableDetailPage';
import { ConfigPage } from '@/pages/ConfigPage';
import { WaiterPage } from '@/pages/WaiterPage';

function AppRoutes() {
  const { session } = useSession();
  const location = useLocation();

  if (!session && location.pathname !== '/session') {
    return <Navigate to="/session" replace />;
  }

  return (
    <Routes>
      <Route path="/session" element={<SessionPage />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/tables" replace />} />
        <Route path="/tables" element={<TablesPage />} />
        <Route path="/tables/:id" element={<TableDetailPage />} />
        <Route path="/config" element={<ConfigPage />} />
        <Route path="/waiter" element={<WaiterPage />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <SessionProvider>
      <WaiterProvider>
        <AppRoutes />
      </WaiterProvider>
    </SessionProvider>
  );
}
