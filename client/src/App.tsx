import { Routes, Route, Navigate } from 'react-router-dom';
import { DataSourceProvider, useDataSource } from '@/context/DataSourceContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { WaiterProvider } from '@/context/WaiterContext';
import { Layout } from '@/components/Layout';
import { TablesPage } from '@/pages/TablesPage';
import { TableDetailPage } from '@/pages/TableDetailPage';
import { ConfigPage } from '@/pages/ConfigPage';
import { WaiterPage } from '@/pages/WaiterPage';
import { LoginPage } from '@/pages/LoginPage';
import { AdminPage } from '@/pages/AdminPage';

function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4" />
      <p className="text-slate-400">{label}</p>
    </div>
  );
}

function AppRoutes() {
  const { checked, label, source } = useDataSource();
  const { user, company, loading: authLoading } = useAuth();

  if (!checked) {
    return <LoadingScreen label="Detectando modo de conexión..." />;
  }

  // Firebase mode requires authentication
  if (source === 'firebase') {
    if (authLoading) {
      return <LoadingScreen label="Verificando sesión..." />;
    }
    if (!user) {
      return <LoginPage />;
    }
    // Logged in but no company → let them register one
    // (handled inside LoginPage via the registerCompany function)
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/tables" replace />} />
        <Route path="/tables" element={<TablesPage />} />
        <Route path="/tables/:id" element={<TableDetailPage />} />
        <Route path="/config" element={<ConfigPage />} />
        <Route path="/waiter" element={<WaiterPage />} />
        <Route path="/admin" element={source === 'firebase' ? <AdminPage /> : <Navigate to="/tables" replace />} />
      </Route>
      {/* Login is rendered outside Layout when unauthenticated */}
      {source !== 'firebase' && <Route path="/login" element={<LoginPage />} />}
    </Routes>
  );
}

export function App() {
  return (
    <DataSourceProvider>
      <AuthProvider>
        <WaiterProvider>
          <AppRoutes />
        </WaiterProvider>
      </AuthProvider>
    </DataSourceProvider>
  );
}
