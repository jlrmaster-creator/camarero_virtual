import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { store } from '@/services/store';
import { ProductAutocomplete } from '@/components/ProductAutocomplete';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useWaiter } from '@/context/WaiterContext';
import { useAuth } from '@/context/AuthContext';
import { generateTicketHtml, printTicket, shareTicket } from '@/utils/ticket';
import type { Zone, OrderItem, Product, GrupoPedido } from '@/types/models';

let itemIdCounter = 0;
function nextItemId(): string {
  itemIdCounter += 1;
  return `item_${itemIdCounter}`;
}
let grupoIdCounter = 0;
function nextGrupoId(): string {
  grupoIdCounter += 1;
  return `g${grupoIdCounter}`;
}

function grupoTotal(grupo: GrupoPedido): number {
  return grupo.items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
}

export function TableDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const returnZone: Zone = (location.state as { zone?: Zone })?.zone ?? 'interior';
  const { currentWaiter } = useWaiter();
  const { role, company } = useAuth();
  const noShift = role === 'waiter' && !currentWaiter;

  const [table, setTable] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [grupos, setGrupos] = useState<GrupoPedido[]>([]);
const [saving, setSaving] = useState(false);
const [savedMsg, setSavedMsg] = useState('');
const [errorMsg, setErrorMsg] = useState('');
const [blockedByOther, setBlockedByOther] = useState(false);
const [assignedWaiterName, setAssignedWaiterName] = useState('Sin asignar');
const [newProductName, setNewProductName] = useState('');
const [newProductPrice, setNewProductPrice] = useState('');
const [showTicket, setShowTicket] = useState(false);
const [ticketHtml, setTicketHtml] = useState('');

  const goBack = useCallback(() => navigate('/tables', { state: { zone: returnZone } }), [navigate, returnZone]);

  const fetchTable = useCallback(async () => {
    if (!id) return;
    try {
      const data = await store.getTable(Number(id));
      setTable(data);
      const occ = data.occupation as Record<string, unknown> | null;
      if (occ) {
        const loadedGrupos = occ.grupos as GrupoPedido[] | undefined;
        if (loadedGrupos && loadedGrupos.length > 0) {
          setGrupos(loadedGrupos);
        } else {
          const cliente = occ.cliente as string;
          const comensales = occ.comensales as number;
          const items = (occ.items as OrderItem[]) ?? [];
          setGrupos([{ id: nextGrupoId(), nombre: cliente?.trim() || 'Comensal', comensales, items }]);
        }
      } else {
        setGrupos([{ id: nextGrupoId(), nombre: 'Comensal', comensales: 1, items: [] }]);
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

  const total = grupos.reduce((sum, g) => sum + grupoTotal(g), 0);

  const addItemToGroup = (groupId: string, product: Product) => {
    setGrupos(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      const existing = g.items.find(i => i.nombre === product.nombre && i.precio === product.precio);
      if (existing) {
        return { ...g, items: g.items.map(i => i.id === existing.id ? { ...i, cantidad: i.cantidad + 1 } : i) };
      }
      return { ...g, items: [...g.items, { id: nextItemId(), nombre: product.nombre, precio: product.precio, cantidad: 1 }] };
    }));
  };

  const updateItemQty = (groupId: string, itemId: string, delta: number) => {
    setGrupos(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        items: g.items.map(i => {
          if (i.id !== itemId) return i;
          const newQty = i.cantidad + delta;
          return newQty <= 0 ? i : { ...i, cantidad: newQty };
        }),
      };
    }));
  };

  const removeItemFromGroup = (groupId: string, itemId: string) => {
    setGrupos(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      return { ...g, items: g.items.filter(i => i.id !== itemId) };
    }));
  };

  const addGroup = () => {
    setGrupos(prev => [...prev, { id: nextGrupoId(), nombre: `Familia ${prev.length + 1}`, comensales: 1, items: [] }]);
  };

  const removeGroup = (groupId: string) => {
    setGrupos(prev => prev.filter(g => g.id !== groupId));
  };

  const updateGroupName = (groupId: string, nombre: string) => {
    setGrupos(prev => prev.map(g => g.id === groupId ? { ...g, nombre } : g));
  };

  const updateGroupComensales = (groupId: string, raw: string) => {
    setGrupos(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      if (raw === '') return { ...g, comensales: 0 };
      const num = parseInt(raw, 10);
      if (isNaN(num) || num < 1) return g;
      return { ...g, comensales: Math.min(num, 20) };
    }));
  };

  const saveOccupation = useCallback(async (data: { grupos: GrupoPedido[]; total: number }) => {
    if (blocked || !table || !id) return;
    const occ = table.occupation as Record<string, unknown> | null;
    const allItems = data.grupos.flatMap(g => g.items);
    const primerCliente = data.grupos[0]?.nombre ?? '';
    const totalComensales = data.grupos.reduce((s, g) => s + (g.comensales || 1), 0);
    const payload = {
      cliente: primerCliente,
      comensales: totalComensales,
      waiter_id: waiterId,
      items: allItems,
      grupos: data.grupos,
      total: data.total,
    };
    if (occ) {
      await store.updateOccupation(occ.id as number, payload);
    } else if (allItems.length > 0) {
      const newOcc = await store.createOccupation({
        table_id: Number(id),
        ...payload,
      });
      setTable(prev => prev ? { ...prev, status: 'occupied', occupation: newOcc } : prev);
    }
  }, [blocked, table, id, waiterId]);

  useAutoSave({ grupos, total }, data =>
    saveOccupation({ ...data })
  );

  const handleSave = async () => {
    if (blocked || !id) return;
    setSaving(true);
    setErrorMsg('');
    try {
      await saveOccupation({ grupos, total });
      setSavedMsg('✓ Guardado');
      setTimeout(() => setSavedMsg(''), 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar. Comprueba tu conexión.';
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleAddNewProduct = async () => {
    if (!newProductName || !newProductPrice || blocked || grupos.length === 0) return;
    const price = Number(newProductPrice);
    if (isNaN(price) || price <= 0) return;
    try {
      const product = await store.createProduct({ nombre: newProductName.trim(), precio: price, categoria: 'comida' });
      setNewProductName('');
      setNewProductPrice('');
      addItemToGroup(grupos[0].id, product);
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

  const handleReopen = async () => {
    if (!id) return;
    try {
      await store.createOccupation({ table_id: Number(id), waiter_id: waiterId });
      goBack();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al reabrir servicio';
      setErrorMsg(msg);
    }
  };

  const handleTicket = () => {
    const nombre = (table?.nombre as string) ?? '';
    const tableName = nombre.replace(/^Mesa\s*/, '') || String(table?.numero ?? '');
    const totalComensales = grupos.reduce((s, g) => s + g.comensales, 0);
    const html = generateTicketHtml({
      companyName: company?.name,
      tableName,
      zone: returnZone === 'interior' ? 'Interior' : 'Terraza',
      waiterName: assignedWaiterName,
      cliente: grupos.map(g => g.nombre).join(', '),
      comensales: totalComensales,
      grupos: grupos.map(g => ({
        nombre: g.nombre,
        items: g.items.map(i => `${i.cantidad}x ${i.nombre} — ${(i.precio * i.cantidad).toFixed(2)}€`).join('\n'),
        subtotal: grupoTotal(g),
      })),
      total,
    });
    setTicketHtml(html);
    setShowTicket(true);
  };

  const handlePrintTicket = () => {
    if (ticketHtml) printTicket(ticketHtml);
  };

  const handleShareTicket = () => {
    if (ticketHtml) shareTicket(ticketHtml, `ticket_mesa_${id}.html`);
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

      {status !== 'paid' && (
        <>
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Clientes / Grupos</h3>
              {!blocked && (
                <button onClick={addGroup} className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                  + Añadir grupo
                </button>
              )}
            </div>

            {grupos.map((grupo, _idx) => (
              <div key={grupo.id} className="border border-slate-600 rounded-lg p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    className="input flex-1 font-medium"
                    value={grupo.nombre}
                    onChange={e => updateGroupName(grupo.id, e.target.value)}
                    disabled={blocked}
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <label className="text-xs text-slate-400">Pers.</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      className="input w-14 text-center"
                      value={grupo.comensales || ''}
                      onChange={e => {
                        if (blocked) return;
                        updateGroupComensales(grupo.id, e.target.value);
                      }}
                      disabled={blocked}
                    />
                  </div>
                  {grupos.length > 1 && !blocked && (
                    <button
                      onClick={() => removeGroup(grupo.id)}
                      className="text-red-400 hover:text-red-300 text-lg leading-none px-1"
                      title="Eliminar grupo"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <ProductAutocomplete
                  key={grupo.id}
                  onAddProduct={product => addItemToGroup(grupo.id, product)}
                  disabled={blocked}
                />

                {grupo.items.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-1">Sin productos</p>
                )}
                {grupo.items.map(item => (
                  <div key={item.id} className="flex items-center gap-2 py-1 text-sm">
                    <span className="flex-1 truncate">{item.nombre}</span>
                    <span className="text-slate-400 w-12 text-right">{item.precio.toFixed(2)}€</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateItemQty(grupo.id, item.id, -1)}
                        className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center disabled:opacity-30"
                        disabled={blocked || item.cantidad <= 1}
                      >
                        −
                      </button>
                      <span className="w-6 text-center font-medium">{item.cantidad}</span>
                      <button
                        onClick={() => updateItemQty(grupo.id, item.id, 1)}
                        className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center"
                        disabled={blocked}
                      >
                        +
                      </button>
                    </div>
                    <span className="w-16 text-right font-medium">{(item.precio * item.cantidad).toFixed(2)}€</span>
                    <button
                      onClick={() => removeItemFromGroup(grupo.id, item.id)}
                      className="text-red-400 hover:text-red-300 text-xs font-bold ml-1"
                      disabled={blocked}
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <div className="text-right text-sm font-semibold text-slate-300">
                  Subtotal: {grupoTotal(grupo).toFixed(2)}€
                </div>
              </div>
            ))}
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
            {savedMsg && <p className="text-green-400 text-sm text-center">{savedMsg}</p>}
            {!blocked && (
              <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
                {saving ? 'Guardando...' : 'Guardar Pedido'}
              </button>
            )}
          </div>
        </>
      )}

      {status === 'paid' && (
        <div className="card space-y-3 bg-slate-100 dark:bg-slate-800/50">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="text-green-500">✓</span> Servicio Finalizado
          </h3>
          {(() => {
            const us = table?.ultimo_servicio as { cliente?: string; total?: number; comensales?: number; grupos?: GrupoPedido[] } | undefined;
            return us ? (
              <div className="text-sm space-y-2 text-slate-600 dark:text-slate-400">
                {us.grupos && us.grupos.length > 1 ? (
                  us.grupos.map(g => (
                    <div key={g.id} className="border-b border-slate-600/30 pb-2 last:border-0">
                      <p className="font-semibold text-slate-200">{g.nombre}</p>
                      <p>Comensales: {g.comensales}</p>
                      <p>Total: {grupoTotal(g).toFixed(2)}€</p>
                    </div>
                  ))
                ) : (
                  <>
                    {us.cliente && <p>Cliente: <strong>{us.cliente}</strong></p>}
                    <p>Comensales: <strong>{us.comensales}</strong></p>
                  </>
                )}
                <p className="text-lg font-bold text-white mt-2">Total: {us.total?.toFixed(2)}€</p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Sin datos del servicio anterior.</p>
            );
          })()}
          <button onClick={handleReopen} className="btn-primary w-full">
            Reabrir Servicio
          </button>
        </div>
      )}

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

      {showTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col">
          <div className="flex-1 p-4 flex flex-col min-h-0">
            <iframe
              srcDoc={ticketHtml}
              className="w-full flex-1 bg-white rounded-lg"
              title="Ticket"
            />
          </div>
          <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 pb-8 flex gap-3 justify-center">
            <button onClick={handlePrintTicket} className="btn-primary">
              Imprimir / PDF
            </button>
            <button onClick={handleShareTicket} className="btn-primary">
              Compartir
            </button>
            <button onClick={() => setShowTicket(false)} className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-6 py-2 rounded-lg font-medium">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
