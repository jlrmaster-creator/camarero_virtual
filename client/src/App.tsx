import { Routes, Route, Navigate } from 'react-router-dom';
import { WaiterProvider } from '@/context/WaiterContext';
import { Layout } from '@/components/Layout';
import { TablesPage } from '@/pages/TablesPage';
import { TableDetailPage } from '@/pages/TableDetailPage';
import { ConfigPage } from '@/pages/ConfigPage';
import { WaiterPage } from '@/pages/WaiterPage';

export function App() {
  return (
    <WaiterProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/tables" replace />} />
          <Route path="/tables" element={<TablesPage />} />
          <Route path="/tables/:id" element={<TableDetailPage />} />
          <Route path="/config" element={<ConfigPage />} />
          <Route path="/waiter" element={<WaiterPage />} />
        </Route>
      </Routes>
    </WaiterProvider>
  );
}
