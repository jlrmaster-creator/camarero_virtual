import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { store } from '@/services/store';
import { ProductAutocomplete } from '@/components/ProductAutocomplete';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useWaiter } from '@/context/WaiterContext';
import { useAuth } from '@/context/AuthContext';
import { generateTicket } from '@/utils/ticket';
import type { Zone, OrderItem, Product } from '@/types/models';

let itemIdCounter = 0;
function nextItemId(): string {
  itemIdCounter += 1;
  return `item_${itemIdCounter}`;
}

export function TableDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const returnZone: Zone = (location.state as { zone?: Zone })?.zone ?? 'interior';
  const { currentWaiter } = useWaiter();
  const { role } = useAuth();
  const noShift = role === 'waiter' && !currentWaiter;

  const [table, setTable] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [cliente, setCliente] = useState('');
  const [comensales, setComensales] = useState<number | ''>(1);
  const [items, setItems] = useState<OrderItem[]>([]);
const [saving, setSaving] = useState(false);
const [errorMsg, setErrorMsg] = useState('');
const [blockedByOther, setBlockedByOther] = useState(false);
const [assignedWaiterName, setAssignedWaiterName] = useState('Sin asignar');
const [newProductName, setNewProductName] = useState('');
const [newProductPrice, setNewProductPrice] = useState('');

  const goBack = useCallback(() => navigate('/tables', { state: { zone: returnZone } }), [navigate, returnZone]);

  const fetchTable = useCallback(async () => {
    if (!id) return;
    try {
      const data = await store.getTable(Number(id));
      setTable(data);
      const occ = data.occupation as Record<string, unknown> | null;
      if (occ) {
        setCliente(occ.cliente as string);
        setComensales(occ.comensales as number);
        setItems((occ.items as OrderItem[]) ?? []);
      } else {
        setCliente('');
        setComensales(1);
        setItems([]);
      }

      const allWaiters = await store.getWaiters();
      const tableDocId = parseInt(id, 10);
      let effectiveWaiterId: number | null = null;
      let resolvedName = 'Sin asignar';
      for (const w of allWaiters) {
        if (w.assigned_table_ids?.includes(tableDocId)) {
          effectiveWaiterId = w.id;
          resolvedName = w.nombre;
          break;
        }
      }
      const occWaiterId = occ?.waiter_id as number | null ?? null;
      if (occWaiterId) {
        effectiveWaiterId = occWaiterId;
        const occWaiter = allWaiters.find(w => w.id === occWaiterId);
        if (occWaiter) resolvedName = occWaiter.nombre;
      }

      setAssignedWaiterName(resolvedName);
      setBlockedByOther(
        role === 'waiter' && currentWaiter !== null && effectiveWaiterId !== null && effectiveWaiterId !== currentWaiter.id
      );
    } catch (e) {
      console.error('[TableDetailPage] fetch table failed:', e);
      goBack();
    } finally {
      setLoading(false);
    }
  }, [id, role, currentWaiter, goBack]);

  useEffect(() => {
    fetchTable();
  }, [fetchTable]);

  const waiterId = currentWaiter?.id ?? (table?.waiter_id as number | null) ?? null;
  const blocked = noShift || blockedByOther;

  const total = items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  const addItem = (product: Product) => {
    const existing = items.find(i => i.nombre === product.nombre && i.precio === product.precio);
    if (existing) {
      setItems(prev => prev.map(i => i.id === existing.id ? { ...i, cantidad: i.cantidad + 1 } : i));
    } else {
      setItems(prev => [...prev, { id: nextItemId(), nombre: product.nombre, precio: product.precio, cantidad: 1 }]);
    }
  };

  const updateQty = (itemId: string, delta: number) => {
    setItems(prev => prev.map(i => {
      if (i.id !== itemId) return i;
      const newQty = i.cantidad + delta;
      return newQty <= 0 ? i : { ...i, cantidad: newQty };
    }));
  };

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
  };

  const saveOccupation = useCallback(async (data: { cliente: string; comensales: number; items: OrderItem[]; total: number }) => {
    if (blocked || !table || !id) return;
    const occ = table.occupation as Record<string, unknown> | null;
    const payload = { cliente: data.cliente, comensales: data.comensales, waiter_id: waiterId, items: data.items, total: data.total };
    if (occ) {
      await store.updateOccupation(occ.id as number, payload);
    } else if (data.cliente || data.items.length > 0) {
      const newOcc = await store.createOccupation({
        table_id: Number(id),
        ...payload,
      });
      setTable(prev => prev ? { ...prev, status: 'occupied', occupation: newOcc } : prev);
    }
  }, [blocked, table, id, waiterId]);

  useAutoSave({ cliente, comensales: comensales === '' ? 1 : comensales, items, total }, data =>
    saveOccupation({ ...data })
  );

  const handleSave = async () => {
    if (blocked || !id) return;
    setSaving(true);
    setErrorMsg('');
    try {
      await saveOccupation({ cliente, comensales: comensales === '' ? 1 : comensales, items, total });
      setErrorMsg('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar. Comprueba tu conexión.';
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleAddNewProduct = async () => {
    if (!newProductName || !newProductPrice || blocked) return;
    const price = Number(newProductPrice);
    if (isNaN(price) || price <= 0) return;
    try {
      const product = await store.createProduct({ nombre: newProductName.trim(), precio: price, categoria: 'comida' });
      setNewProductName('');
      setNewProductPrice('');
      addItem(product);
    } catch (e) {
      setErrorMsg('Error al crear el producto');
      console.error('[TableDetailPage] create product failed:', e);
    }
  };

  const handleFinish = async () => {
    const occ = table?.occupation as Record<string, unknown> | null;
    if (!occ) return;
    if (!window.confirm('¿Finalizar servicio de esta mesa?')) return;
    try {
      await store.finishOccupation(occ.id as number, Number(id));
      goBack();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al finalizar servicio';
      setErrorMsg(msg);
      console.error('[TableDetailPage] finish failed:', e);
    }
  };

  const handleTicket = () => {
    const nombre = (table?.nombre as string) ?? '';
    const tableName = nombre.replace(/^Mesa\s*/, '') || String(table?.numero ?? '');
    const itemsText = items.map(i => `${i.cantidad}x ${i.nombre} — ${(i.precio * i.cantidad).toFixed(2)}€`).join('\n');
    generateTicket({
      tableName,
      zone: returnZone === 'interior' ? 'Interior' : 'Terraza',
      waiterName: assignedWaiterName,
      cliente,
      comensales: comensales === '' ? 1 : comensales,
      nota: itemsText,
      total,
    });
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Cargando...</div>;
  }

  if (!table) {
    return <div className="text-center py-8 text-red-500">Mesa no encontrada</div>;
  }

  const statusLabel: Record<string, string> = {
    free: 'Libre',
    occupied: 'Ocupada',
    pending_payment: 'Pte. Cobro',
    partial: 'Parcial',
    paid: 'Cobrada',
  };

  const nombre = table.nombre as string;
  const numero = table.numero as number;
  const status = table.status as string;

  return (
    <div className="space-y-4">
      <button onClick={goBack} className="text-blue-600 text-sm">
        ← Volver
      </button>

      {noShift && (
        <div className="bg-yellow-900/50 text-yellow-300 px-4 py-3 rounded-lg text-sm text-center">
          No tienes un turno activo. No puedes modificar esta mesa hasta que un administrador active tu turno.
        </div>
      )}

      {blockedByOther && (
        <div className="bg-red-900/50 text-red-200 px-4 py-3 rounded-lg text-sm text-center">
          Esta mesa está asignada a otro camarero. No puedes modificarla.
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-900/50 text-red-200 px-4 py-2 rounded-lg text-sm text-center">
          {errorMsg}
        </div>
      )}

      <div className="card">
        <h2 className="text-2xl font-bold">{nombre?.replace(/^Mesa\s*/, '') || String(numero)}</h2>
        <p className="text-sm text-slate-500">Estado: {statusLabel[status] ?? status}</p>
      </div>

      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Camarero Asignado</h3>
          <span className={`text-sm ${blockedByOther ? 'text-red-400 font-medium' : 'text-slate-400'}`}>
            {assignedWaiterName}
          </span>
        </div>
        <p className="text-xs text-slate-500">
          La asignación se gestiona desde la pantalla de Camareros.
        </p>
      </div>

      <div className="card space-y-3">
        <h3 className="font-semibold">Cliente</h3>
        <input
          className="input"
          placeholder="Nombre del cliente"
          value={cliente}
          onChange={e => setCliente(e.target.value)}
          disabled={blocked}
        />
        <div>
          <label className="text-sm text-slate-500">Comensales</label>
          <input
            type="number"
            min={1}
            max={20}
            className="input"
            value={comensales}
            onChange={e => {
              if (blocked) return;
              const val = e.target.value;
              setComensales(val === '' ? '' : Number(val));
            }}
            disabled={blocked}
          />
        </div>
      </div>

      <div className="card space-y-3">
        <h3 className="font-semibold">Pedido</h3>
        <ProductAutocomplete onAddProduct={addItem} disabled={blocked} />

        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {items.length === 0 && (
            <p className="text-sm text-slate-500 py-2">No hay productos añadidos</p>
          )}
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-2 py-2 text-sm">
              <span className="flex-1 truncate">{item.nombre}</span>
              <span className="text-slate-400 w-12 text-right">{item.precio.toFixed(2)}€</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateQty(item.id, -1)}
                  className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center disabled:opacity-30"
                  disabled={blocked || item.cantidad <= 1}
                >
                  −
                </button>
                <span className="w-6 text-center font-medium">{item.cantidad}</span>
                <button
                  onClick={() => updateQty(item.id, 1)}
                  className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center"
                  disabled={blocked}
                >
                  +
                </button>
              </div>
              <span className="w-16 text-right font-medium">{(item.precio * item.cantidad).toFixed(2)}€</span>
              <button
                onClick={() => removeItem(item.id)}
                className="text-red-400 hover:text-red-300 text-xs font-bold ml-1"
                disabled={blocked}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {!blocked && (
        <div className="card space-y-3">
          <h3 className="font-semibold">Añadir producto nuevo</h3>
          <div className="flex gap-2">
            <input
              className="input flex-1 min-w-0"
              placeholder="Nombre del producto"
              value={newProductName}
              onChange={e => setNewProductName(e.target.value)}
            />
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="input w-20"
              placeholder="Precio"
              value={newProductPrice}
              onChange={e => setNewProductPrice(e.target.value)}
            />
            <button onClick={handleAddNewProduct} className="btn-primary shrink-0">
              Añadir
            </button>
          </div>
        </div>
      )}

      <div className="card space-y-3">
        <h3 className="font-semibold">Total</h3>
        <div className="text-2xl font-bold">{total.toFixed(2)}€</div>
        {!blocked && (
          <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
            {saving ? 'Guardando...' : 'Guardar Pedido'}
          </button>
        )}
      </div>

      {status !== 'free' && status !== 'paid' && (
        <div className="flex gap-2">
          <button onClick={handleFinish} className={`btn-danger flex-1 ${blocked ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={blocked}>
            Finalizar Servicio
          </button>
          <button onClick={handleTicket} className="btn-primary flex-1" disabled={blocked}>
            Generar Ticket
          </button>
        </div>
      )}
    </div>
  );
}
