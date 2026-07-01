import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { WaiterProvider } from '@/context/WaiterContext';
import { Layout } from '@/components/Layout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TablesPage } from '@/pages/TablesPage';
import { TableDetailPage } from '@/pages/TableDetailPage';
import { ConfigPage } from '@/pages/ConfigPage';
import { WaiterPage } from '@/pages/WaiterPage';
import { LoginPage } from '@/pages/LoginPage';
import { AdminPage } from '@/pages/AdminPage';
import { OrdersPage } from '@/pages/OrdersPage';

function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4" />
      <p className="text-slate-400">{label}</p>
    </div>
  );
}

function AppRoutes() {
  const { user, role, loading: authLoading } = useAuth();

  if (authLoading) {
    return <LoadingScreen label="Verificando sesión..." />;
  }

  if (!user) {
    return <LoginPage />;
  }

  const isReceptor = role === 'receptor';
  const isAdmin = role === 'admin';

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to={isReceptor ? '/orders' : '/tables'} replace />} />
        {isReceptor ? (
          <Route path="/orders" element={<OrdersPage />} />
        ) : (
          <>
            <Route path="/tables" element={<TablesPage />} />
            <Route path="/tables/:id" element={<TableDetailPage />} />
            <Route path="/config" element={<ConfigPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            {isAdmin && <Route path="/waiter" element={<WaiterPage />} />}
            {isAdmin && <Route path="/admin" element={<AdminPage />} />}
          </>
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <WaiterProvider>
          <AppRoutes />
        </WaiterProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
