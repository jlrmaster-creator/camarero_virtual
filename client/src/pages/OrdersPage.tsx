import { useState, useEffect, useCallback } from 'react';
import { store } from '@/services/store';
import type { OrderRequest, GrupoPedido } from '@/types/models';

function grupoTotal(grupo: GrupoPedido): number {
  return grupo.items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
}

const statusColors: Record<string, string> = {
  sent: 'border-l-yellow-500',
  preparing: 'border-l-blue-500',
  completed: 'border-l-slate-500 bg-slate-700/30',
  paid: 'border-l-green-500 bg-slate-700/30',
};

const statusLabels: Record<string, string> = {
  sent: 'Enviado',
  preparing: 'Preparando',
  completed: 'Completado',
  paid: 'Pagado',
};

export function OrdersPage() {
  const [orders, setOrders] = useState<OrderRequest[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleComplete = async (id: string) => {
    try {
      await store.completeOrder(id);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'completed', completed_at: new Date().toISOString() } : o));
    } catch (e) {
      console.error('[OrdersPage] complete failed:', e);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Cargando pedidos...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-white">Pedidos</h1>
        <p className="text-slate-400 text-center py-12">No hay pedidos recibidos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Pedidos</h1>

      {orders.map(order => {
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
      })}

      <button
        onClick={fetchOrders}
        className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 py-2 rounded-lg text-sm transition-colors"
      >
        Actualizar
      </button>
    </div>
  );
}
