import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tablesService } from '@/services/tables';
import { occupationsService } from '@/services/occupations';
import { ProductAutocomplete } from '@/components/ProductAutocomplete';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useWaiter } from '@/context/WaiterContext';
import type { TableWithOccupation } from '@/services/tables';

export function TableDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentWaiter } = useWaiter();
  const [table, setTable] = useState<TableWithOccupation | null>(null);
  const [loading, setLoading] = useState(true);
  const [cliente, setCliente] = useState('');
  const [comensales, setComensales] = useState(1);
  const [nota, setNota] = useState('');
  const [total, setTotal] = useState(0);

  const fetchTable = useCallback(async () => {
    if (!id) return;
    try {
      const data = await tablesService.getById(Number(id));
      setTable(data);
      if (data.occupation) {
        setCliente(data.occupation.cliente);
        setComensales(data.occupation.comensales);
        setNota(data.occupation.nota);
        setTotal(data.occupation.total);
      } else {
        setCliente('');
        setComensales(1);
        setNota('');
        setTotal(0);
      }
    } catch {
      navigate('/tables');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchTable();
  }, [fetchTable]);

  const saveOccupation = useCallback(async (data: { cliente: string; comensales: number; nota: string; total: number }) => {
    if (!table || !id) return;
    if (table.occupation) {
      await occupationsService.update(table.occupation.id, data);
    } else if (data.cliente || data.nota) {
      const occ = await occupationsService.create({
        table_id: Number(id),
        waiter_id: currentWaiter?.id ?? null,
        ...data,
      });
      setTable(prev => prev ? { ...prev, status: 'occupied', occupation: occ } : prev);
    }
  }, [table, id, currentWaiter]);

  useAutoSave({ cliente, comensales, nota, total }, saveOccupation);

  const handleFinish = async () => {
    if (!table?.occupation) return;
    if (!window.confirm('¿Finalizar servicio de esta mesa?')) return;
    await occupationsService.finish(table.occupation.id);
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

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/tables')} className="text-blue-600 text-sm">
        ← Volver
      </button>

      <div className="card">
        <h2 className="text-2xl font-bold">{table.nombre || `Mesa ${table.numero}`}</h2>
        <p className="text-sm text-slate-500">Estado: {statusLabel[table.status] ?? table.status}</p>
      </div>

      <div className="card space-y-3">
        <h3 className="font-semibold">Cliente</h3>
        <input
          className="input"
          placeholder="Nombre del cliente"
          value={cliente}
          onChange={e => setCliente(e.target.value)}
        />
        <div>
          <label className="text-sm text-slate-500">Comensales</label>
          <input
            type="number"
            min={1}
            max={20}
            className="input"
            value={comensales}
            onChange={e => setComensales(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="card space-y-3">
        <h3 className="font-semibold">Comanda</h3>
        <ProductAutocomplete value={nota} onChange={setNota} />
      </div>

      <div className="card space-y-3">
        <h3 className="font-semibold">Total</h3>
        <div className="text-2xl font-bold">{total.toFixed(2)}€</div>
        <div className="flex gap-2">
          {[0, 5, 10, 15, 20, 30, 50].map(amount => (
            <button
              key={amount}
              onClick={() => setTotal(prev => prev + amount)}
              className="btn-primary text-sm flex-1"
            >
              +{amount}€
            </button>
          ))}
        </div>
      </div>

      {table.status !== 'free' && table.status !== 'paid' && (
        <button onClick={handleFinish} className="btn-danger w-full">
          Finalizar Servicio
        </button>
      )}
    </div>
  );
}
