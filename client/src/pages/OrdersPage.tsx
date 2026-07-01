import { useState, useEffect, useCallback } from 'react';
import { store } from '@/services/store';
import { useAuth } from '@/context/AuthContext';
import type { OrderRequest, GrupoPedido } from '@/types/models';

function grupoTotal(grupo: GrupoPedido): number {
  return grupo.items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
}

const statusColors: Record<string, string> = {
  sent: 'border-l-yellow-500',
  preparing: 'border-l-blue-500',
  completed: 'border-l-slate-500',
  paid: 'border-l-green-500',
};

const statusLabels: Record<string, string> = {
  sent: 'Enviado',
  preparing: 'Preparando',
  completed: 'Completado',
  paid: 'Pagado',
};

const tabs = [
  { key: 'active', label: 'Pedidos en proceso' },
  { key: 'completed', label: 'Pedidos completados' },
] as const;

function generateCompletedOrdersHtml(orders: OrderRequest[]): string {
  const total = orders.reduce((s, o) => s + o.total, 0);
  const byDate: Record<string, OrderRequest[]> = {};
  for (const o of orders) {
    const d = new Date(o.sent_at).toLocaleDateString('es-ES');
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(o);
  }

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>Informe de pedidos completados</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 14px; padding: 20px; color: #333; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  .date { color: #666; margin-bottom: 20px; }
  h2 { font-size: 16px; margin-top: 24px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #eee; }
  th { background: #f5f5f5; }
  .right { text-align: right; }
  .total-row td { font-weight: bold; border-top: 2px solid #333; }
  .grand-total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
</style></head>
<body>
  <h1>Informe de pedidos completados</h1>
  <p class="date">Generado el ${new Date().toLocaleString('es-ES')}</p>
  ${Object.entries(byDate).map(([date, dayOrders]) => `
    <h2>${date}</h2>
    <table>
      <tr><th>Hora</th><th>Mesa</th><th>Camarero</th><th>Cliente</th><th class="right">Total</th></tr>
      ${dayOrders.map(o => `
        <tr>
          <td>${new Date(o.sent_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</td>
          <td>${o.table_name}</td>
          <td>${o.waiter_name}</td>
          <td>${o.cliente}</td>
          <td class="right">${o.total.toFixed(2)}€</td>
        </tr>
      `).join('')}
      <tr class="total-row"><td colspan="4" class="right">Total del día</td><td class="right">${dayOrders.reduce((s, o) => s + o.total, 0).toFixed(2)}€</td></tr>
    </table>
  `).join('')}
  <div class="grand-total">Total general: ${total.toFixed(2)}€ &mdash; ${orders.length} pedidos</div>
</body></html>`;
}

export function OrdersPage() {
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const [orders, setOrders] = useState<OrderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>('active');

  const fetchOrders = useCallback(async () => {
    try {
      const all = await store.getOrders();
      setOrders(all);
    } catch (e) {
      console.error('[OrdersPage] fetch failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const activeOrders = orders.filter(o => o.status === 'sent' || o.status === 'preparing');
  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'paid');

  const handleComplete = async (id: string) => {
    try {
      await store.completeOrder(id);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'completed', completed_at: new Date().toISOString() } : o));
    } catch (e) {
      console.error('[OrdersPage] complete failed:', e);
    }
  };

  const handlePrintReport = () => {
    const html = generateCompletedOrdersHtml(completedOrders);
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      setTimeout(() => w.print(), 500);
    }
  };

  const allTabs = isAdmin
    ? [...tabs, { key: 'report', label: 'Informe' }]
    : [...tabs];

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Cargando pedidos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex border-b border-slate-700">
        {allTabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'active' && (
        <>
          <h1 className="text-xl font-bold text-white">Pedidos en proceso</h1>
          {activeOrders.length === 0 ? (
            <p className="text-slate-400 text-center py-12">No hay pedidos en proceso.</p>
          ) : (
            <>
              {activeOrders.map(order => renderOrderCard(order, handleComplete))}
              <button onClick={fetchOrders} className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 py-2 rounded-lg text-sm transition-colors">
                Actualizar
              </button>
            </>
          )}
        </>
      )}

      {tab === 'completed' && (
        <>
          <h1 className="text-xl font-bold text-white">Pedidos completados</h1>
          {completedOrders.length === 0 ? (
            <p className="text-slate-400 text-center py-12">No hay pedidos completados.</p>
          ) : (
            <>
              {completedOrders.map(order => renderOrderCard(order, handleComplete))}
              <button onClick={fetchOrders} className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 py-2 rounded-lg text-sm transition-colors">
                Actualizar
              </button>
            </>
          )}
        </>
      )}

      {tab === 'report' && isAdmin && (
        <>
          <h1 className="text-xl font-bold text-white">Informe de pedidos completados</h1>
          <p className="text-sm text-slate-400">
            {completedOrders.length} pedidos completados — Total: {completedOrders.reduce((s, o) => s + o.total, 0).toFixed(2)}€
          </p>
          {completedOrders.length === 0 ? (
            <p className="text-slate-400 text-center py-12">No hay pedidos completados para informar.</p>
          ) : (
            <button onClick={handlePrintReport} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
              Imprimir / Guardar PDF
            </button>
          )}
        </>
      )}
    </div>
  );
}

function renderOrderCard(order: OrderRequest, handleComplete: (id: string) => void) {
  return (
    <div
      key={order.id}
      className={`bg-slate-800 rounded-xl p-4 border-l-4 ${statusColors[order.status] ?? 'border-l-slate-600'} transition-colors`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h3 className="text-lg font-bold text-white">{order.table_name}</h3>
          <p className="text-sm text-slate-400">{order.cliente || 'Sin cliente'}</p>
        </div>
        <div className="text-right shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            order.status === 'paid' ? 'bg-green-900/50 text-green-300' :
            order.status === 'completed' ? 'bg-slate-600/50 text-slate-300' :
            order.status === 'preparing' ? 'bg-blue-900/50 text-blue-300' :
            'bg-yellow-900/50 text-yellow-300'
          }`}>
            {statusLabels[order.status] ?? order.status}
          </span>
          <p className="text-lg font-bold text-white mt-1">{order.total.toFixed(2)}€</p>
        </div>
      </div>

      {order.grupos.map(grupo => (
        <div key={grupo.id} className="bg-slate-700/50 rounded-lg p-3 mb-2 last:mb-0">
          <p className="text-sm font-semibold text-blue-300 mb-1">{grupo.nombre}</p>
          <div className="text-sm text-slate-300 space-y-0.5">
            {grupo.items.map(item => (
              <div key={item.id} className="flex justify-between">
                <span>{item.cantidad}x {item.nombre}</span>
                <span className="text-slate-400">{(item.precio * item.cantidad).toFixed(2)}€</span>
              </div>
            ))}
          </div>
          <div className="text-right text-sm font-semibold text-slate-200 mt-1">
            Subtotal: {grupoTotal(grupo).toFixed(2)}€
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700">
        <span className="text-xs text-slate-500">
          {new Date(order.sent_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          {' — '}{order.waiter_name}
        </span>
        <div className="flex gap-2">
          {order.status === 'sent' && (
            <button
              onClick={() => handleComplete(order.id)}
              className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
            >
              Completado
            </button>
          )}
          {order.status === 'paid' && (
            <span className="text-green-500 font-bold text-lg">✓</span>
          )}
        </div>
      </div>
    </div>
  );
}
