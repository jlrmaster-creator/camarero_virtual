import { useState } from 'react';
import { useWaiter } from '@/context/WaiterContext';
import { useAuth } from '@/context/AuthContext';
import { store } from '@/services/store';
import type { Waiter } from '@/types/models';

export function WaiterPage() {
  const { currentWaiter, setCurrentWaiter, activeWaiters, refresh } = useWaiter();
  const { user, company } = useAuth();
  const [newName, setNewName] = useState('');
  const [allWaiters, setAllWaiters] = useState<Waiter[]>([]);
  const [showAll, setShowAll] = useState(false);

  const fetchAll = async () => {
    const data = await store.getWaiters();
    setAllWaiters(data);
  };

  const addWaiter = async () => {
    if (!newName.trim()) return;
    await store.createWaiter(newName.trim());
    setNewName('');
    await refresh();
    await fetchAll();
  };

  const startShift = async (id: number) => {
    const waiter = await store.startWaiterShift(id);
    setCurrentWaiter(waiter);
    await refresh();
  };

  const endShift = async (id: number) => {
    await store.endWaiterShift(id);
    setCurrentWaiter(null);
    await refresh();
  };

  const canSeeAdminOption = user && company;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Camareros</h1>

      {!currentWaiter && (
        <div className="card space-y-3">
          <h2 className="font-semibold">Iniciar Jornada</h2>
          <p className="text-sm text-slate-500">Selecciona tu nombre o añádelo si es la primera vez.</p>

          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Nombre del camarero"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <button onClick={addWaiter} className="btn-primary">Añadir</button>
          </div>

          {activeWaiters.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Camareros activos:</p>
              {activeWaiters.map(w => (
                <div key={w.id} className="flex justify-between items-center p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <span>{w.nombre}</span>
                  <button onClick={() => startShift(w.id)} className="btn-primary text-sm">
                    Trabajar
                  </button>
                </div>
              ))}
            </div>
          )}

          {canSeeAdminOption && (
            <p className="text-xs text-slate-400 pt-2 border-t border-slate-700">
              Si no encuentras tu nombre, créalo arriba o selecciónalo en &quot;Ver todos los camareros&quot;.
            </p>
          )}
        </div>
      )}

      {currentWaiter && (
        <div className="card space-y-3">
          <h2 className="font-semibold">Mi Jornada</h2>
          <p className="text-lg">{currentWaiter.nombre}</p>
          <p className="text-xs text-slate-400">
            Asignando mesas como: <span className="text-white">{currentWaiter.nombre}</span>
          </p>
          <button onClick={() => endShift(currentWaiter.id)} className="btn-danger w-full">
            Cerrar Jornada
          </button>
        </div>
      )}

      <button
        onClick={() => { setShowAll(!showAll); if (!showAll) fetchAll(); }}
        className="text-blue-600 text-sm"
      >
        {showAll ? 'Ocultar' : 'Ver todos los camareros'}
      </button>

      {showAll && (
        <div className="card">
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {allWaiters.map(w => (
              <li key={w.id} className="flex justify-between items-center py-2 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate">{w.nombre}</span>
                  <span className={`text-xs shrink-0 ${w.activo ? 'text-green-500' : 'text-slate-500'}`}>
                    {w.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                {!currentWaiter && !w.activo && (
                  <button onClick={() => startShift(w.id)} className="btn-primary text-xs shrink-0">
                    Trabajar
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
