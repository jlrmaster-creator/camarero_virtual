import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { store } from '@/services/store';
import { ProductAutocomplete } from '@/components/ProductAutocomplete';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useWaiter } from '@/context/WaiterContext';
import { useAuth } from '@/context/AuthContext';
import type { Waiter } from '@/types/models';

export function TableDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentWaiter } = useWaiter();
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const blocked = role === 'waiter' && !currentWaiter;

  const [table, setTable] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [cliente, setCliente] = useState('');
  const [comensales, setComensales] = useState<number | ''>(1);
  const [nota, setNota] = useState('');
  const [total, setTotal] = useState(0);
  const [waiterId, setWaiterId] = useState<number | null>(null);
  const [allWaiters, setAllWaiters] = useState<Waiter[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    store.getWaiters().then(setAllWaiters).catch(() => {});
  }, []);

  const fetchTable = useCallback(async () => {
    if (!id) return;
    try {
      const data = await store.getTable(Number(id));
      setTable(data);
      const occ = data.occupation as Record<string, unknown> | null;
      if (occ) {
        setCliente(occ.cliente as string);
        setComensales(occ.comensales as number);
        setNota(occ.nota as string);
        setTotal(occ.total as number);
      } else {
        setCliente('');
        setComensales(1);
        setNota('');
        setTotal(0);
      }
      setWaiterId((data.waiter_id as number) ?? (occ?.waiter_id as number) ?? null);
    } catch {
      navigate('/tables');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchTable();
  }, [fetchTable]);

  const assignWaiter = async (wid: number | null) => {
    if (!id || blocked) return;
    setErrorMsg('');
    await store.updateTable(Number(id), { waiter_id: wid ?? null });
    setWaiterId(wid);
    setTable(prev => prev ? { ...prev, waiter_id: wid } : prev);
  };

  const saveOccupation = useCallback(async (data: { cliente: string; comensales: number; nota: string; total: number }) => {
    if (blocked || !table || !id) return;
    const occ = table.occupation as Record<string, unknown> | null;
    if (occ) {
      await store.updateOccupation(occ.id as number, { ...data, waiter_id: waiterId });
    } else if (data.cliente || data.nota) {
      const newOcc = await store.createOccupation({
        table_id: Number(id),
        ...data,
        waiter_id: waiterId,
      });
      setTable(prev => prev ? { ...prev, status: 'occupied', occupation: newOcc } : prev);
    }
  }, [blocked, table, id, waiterId]);

  useAutoSave({ cliente, comensales: comensales === '' ? 1 : comensales, nota, total }, saveOccupation);

  const handleSave = async () => {
    if (blocked || !id) return;
    setSaving(true);
    setErrorMsg('');
    try {
      await assignWaiter(waiterId);
      await saveOccupation({
        cliente,
        comensales: comensales === '' ? 1 : comensales,
        nota,
        total,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = async () => {
    const occ = table?.occupation as Record<string, unknown> | null;
    if (!occ) return;
    if (!window.confirm('¿Finalizar servicio de esta mesa?')) return;
    await store.finishOccupation(occ.id as number, Number(id));
    navigate('/tables');
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
  
  const assignedWaiterName = allWaiters.find(w => w.id === waiterId)?.nombre || 'Sin asignar';

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/tables')} className="text-blue-600 text-sm">
        ← Volver
      </button>

      {blocked && (
        <div className="bg-yellow-900/50 text-yellow-300 px-4 py-3 rounded-lg text-sm text-center">
          No tienes un turno activo. No puedes modificar esta mesa hasta que un administrador active tu turno.
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-900/50 text-red-200 px-4 py-2 rounded-lg text-sm text-center">
          {errorMsg}
        </div>
      )}

      <div className="card flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{nombre?.replace(/^Mesa\s*/, '') || String(numero)}</h2>
          <p className="text-sm text-slate-500">Estado: {statusLabel[status] ?? status}</p>
        </div>
        {!blocked && (
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        )}
      </div>

      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Camarero Asignado</h3>
          {isAdmin ? (
            <select
              className="input py-1 px-2 text-sm w-48"
              value={waiterId || ''}
              onChange={e => {
                const wid = e.target.value ? Number(e.target.value) : null;
                assignWaiter(wid).catch(err => {
                  setErrorMsg(err instanceof Error ? err.message : 'Error al asignar camarero');
                  console.error(err);
                });
              }}
              disabled={blocked}
            >
              <option value="">Sin asignar</option>
              {allWaiters.map(w => (
                <option key={w.id} value={w.id}>{w.nombre}</option>
              ))}
            </select>
          ) : (
            <span className="text-sm text-slate-400">{assignedWaiterName}</span>
          )}
        </div>
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
        <h3 className="font-semibold">Comanda</h3>
        <ProductAutocomplete value={nota} onChange={blocked ? () => {} : setNota} />
      </div>

      <div className="card space-y-3">
        <h3 className="font-semibold">Total</h3>
        <div className="text-2xl font-bold">{total.toFixed(2)}€</div>
        <div className="flex gap-2 flex-wrap">
          {[0, 5, 10, 15, 20, 30, 50].map(amount => (
            <button
              key={amount}
              onClick={() => { if (!blocked) setTotal(prev => prev + amount); }}
              className={`btn-primary text-sm flex-1 min-w-[60px] ${blocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={blocked}
            >
              +{amount}€
            </button>
          ))}
        </div>
      </div>

      {status !== 'free' && status !== 'paid' && (
        <button onClick={handleFinish} className={`btn-danger w-full ${blocked ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={blocked}>
          Finalizar Servicio
        </button>
      )}
    </div>
  );
}
