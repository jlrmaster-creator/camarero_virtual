import { useState, useEffect } from 'react';
import { useWaiter } from '@/context/WaiterContext';
import { useAuth } from '@/context/AuthContext';
import { store } from '@/services/store';
import type { Waiter } from '@/types/models';

export function WaiterPage() {
  const { currentWaiter, setCurrentWaiter, activeWaiters, refresh } = useWaiter();
  const { user, company, role, roleReady } = useAuth();
  const [newName, setNewName] = useState('');
  const [allWaiters, setAllWaiters] = useState<Waiter[]>([]);
  const [showAll, setShowAll] = useState(false);
  const isAdmin = role === 'admin';

  // Assignment state per waiter
  const [assignInput, setAssignInput] = useState<Record<number, string>>({});
  const [allTableNumbers, setAllTableNumbers] = useState<number[]>([]);

  if (roleReady && !isAdmin) {
    return (
      <div className="text-center py-8 text-slate-500">
        No tienes permisos para gestionar camareros.
      </div>
    );
  }

  const fetchAll = async () => {
    const data = await store.getWaiters();
    setAllWaiters(data);
  };

  useEffect(() => {
    if (showAll) fetchAll();
  }, [showAll, user?.uid]);

  // Fetch all table numbers for assignment validation
  useEffect(() => {
    store.getTables().then(tables => {
      const nums = tables
        .map(t => t.numero as number)
        .filter((n): n is number => n != null)
        .sort((a, b) => a - b);
      setAllTableNumbers(nums);
    }).catch(() => {});
  }, []);

  const addWaiter = async () => {
    if (!newName.trim()) return;
    await store.createWaiter(newName.trim());
    setNewName('');
    await refresh();
    await fetchAll();
  };

  const startShift = async (id: number) => {
    const waiter = await store.startWaiterShift(id);
    if (!user || waiter?.auth_uid === user.uid) {
      setCurrentWaiter(waiter || null);
    }
    await refresh();
    if (showAll) await fetchAll();
  };

  const endShift = async (id: number) => {
    await store.endWaiterShift(id);
    if (!user || currentWaiter?.id === id) {
      setCurrentWaiter(null);
    }
    await refresh();
    if (showAll) await fetchAll();
  };

  const handleAssignTable = async (waiterId: number) => {
    const raw = assignInput[waiterId]?.trim();
    if (!raw) return;
    const num = parseInt(raw, 10);
    if (isNaN(num) || !allTableNumbers.includes(num)) {
      console.warn(`[WaiterPage] Mesa ${num} no existe`);
      return;
    }
    try {
      await store.assignTable(waiterId, num);
      setAssignInput(prev => ({ ...prev, [waiterId]: '' }));
      await refresh();
      if (showAll) await fetchAll();
    } catch (e) {
      console.error('[WaiterPage] assign failed:', e);
    }
  };

  const handleUnassignTable = async (waiterId: number, tableId: number) => {
    try {
      await store.unassignTable(waiterId, tableId);
      await refresh();
      if (showAll) await fetchAll();
    } catch (e) {
      console.error('[WaiterPage] unassign failed:', e);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Camareros</h1>

      {/* Current shift status */}
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

      {/* Always show the waiter list for admin; for waiters, only when not in shift */}
      {(!currentWaiter || isAdmin) && (
        <div className="card space-y-3">
          <h2 className="font-semibold">{isAdmin && currentWaiter ? 'Gestionar camareros' : 'Iniciar Jornada'}</h2>
          <p className="text-sm text-slate-500">Selecciona un camarero para ponerlo a trabajar o créalo si es la primera vez.</p>

          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Nombre del camarero"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <button onClick={addWaiter} className="btn-primary">Añadir</button>
          </div>

          {/* Active waiters: can take shift + assign tables */}
          {activeWaiters.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Camareros activos:</p>
              {activeWaiters.map(w => {
                const isMe = currentWaiter?.id === w.id;
                const assigned = w.assigned_table_ids ?? [];
                return (
                  <div key={w.id} className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{w.nombre}{isMe ? ' (en uso)' : ''}</span>
                      <button
                        onClick={() => isMe ? endShift(w.id) : startShift(w.id)}
                        className={`text-sm px-3 py-1 rounded font-medium ${
                          isMe
                            ? 'bg-red-600/20 text-red-300 hover:bg-red-600/40'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {isMe ? 'Cerrar' : 'Trabajar'}
                      </button>
                    </div>

                    {/* Assigned tables */}
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Mesas asignadas:</p>
                      <div className="flex flex-wrap gap-1">
                        {assigned.length === 0 && (
                          <span className="text-xs text-slate-400">Ninguna</span>
                        )}
                        {assigned.map(tid => (
                          <span
                            key={tid}
                            className="inline-flex items-center gap-1 bg-blue-600/20 text-blue-300 text-xs px-2 py-0.5 rounded-full"
                          >
                            Mesa {tid}
                            <button
                              onClick={() => handleUnassignTable(w.id, tid)}
                              className="text-blue-300/60 hover:text-blue-100 ml-0.5"
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Add table input */}
                    <div className="flex gap-2">
                      <input
                        className="input py-1 px-2 text-sm flex-1"
                        placeholder="Nº mesa (ej: 5)"
                        value={assignInput[w.id] ?? ''}
                        onChange={e => setAssignInput(prev => ({ ...prev, [w.id]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') handleAssignTable(w.id); }}
                      />
                      <button
                        onClick={() => handleAssignTable(w.id)}
                        className="btn-primary text-xs"
                      >
                        Añadir
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => { setShowAll(!showAll); }}
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
                {(isAdmin || !currentWaiter) && !w.activo && (
                  <button onClick={() => startShift(w.id)} className="btn-primary text-xs shrink-0">
                    Trabajar
                  </button>
                )}
                {w.activo && (isAdmin || currentWaiter?.id === w.id) && (
                  <button onClick={() => endShift(w.id)} className="bg-red-600/20 text-red-300 hover:bg-red-600/40 text-xs px-2 py-1 rounded">
                    Cerrar
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
