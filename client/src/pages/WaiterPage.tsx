import { useState, useEffect } from 'react';
import { useWaiter } from '@/context/WaiterContext';
import { useAuth } from '@/context/AuthContext';
import { store } from '@/services/store';
import type { Waiter } from '@/types/models';
import type { Zone } from '@/types/models';

function parseTableInput(input: string): number[] {
  const parts = input.split(',').map(s => s.trim()).filter(Boolean);
  const result: number[] = [];
  for (const part of parts) {
    if (part.includes('-')) {
      const [a, b] = part.split('-').map(s => parseInt(s.trim(), 10));
      if (!isNaN(a) && !isNaN(b)) {
        const start = Math.min(a, b);
        const end = Math.max(a, b);
        for (let i = start; i <= end; i++) result.push(i);
      }
    } else {
      const num = parseInt(part, 10);
      if (!isNaN(num)) result.push(num);
    }
  }
  return [...new Set(result)].sort((a, b) => a - b);
}

export function WaiterPage() {
  const { currentWaiter, setCurrentWaiter, activeWaiters, refresh } = useWaiter();
  const { user, company, role, roleReady } = useAuth();
  const [newName, setNewName] = useState('');
  const [allWaiters, setAllWaiters] = useState<Waiter[]>([]);
  const [showAll, setShowAll] = useState(false);
  const isAdmin = role === 'admin';

  interface TableMapEntry { docId: number; nombre: string; numero: number }
  const [interiorTables, setInteriorTables] = useState<TableMapEntry[]>([]);
  const [terrazaTables, setTerrazaTables] = useState<TableMapEntry[]>([]);

  const [intInput, setIntInput] = useState<Record<number, string>>({});
  const [extInput, setExtInput] = useState<Record<number, string>>({});

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

  useEffect(() => {
    store.getTables().then(tables => {
      const interior: TableMapEntry[] = [];
      const terraza: TableMapEntry[] = [];
      for (const t of tables) {
        const zone = t.zone as Zone;
        const entry = { docId: parseInt(String(t.id), 10), nombre: t.nombre as string, numero: t.numero as number };
        if (zone === 'interior') interior.push(entry);
        else if (zone === 'terraza') terraza.push(entry);
      }
      interior.sort((a, b) => a.numero - b.numero);
      terraza.sort((a, b) => a.numero - b.numero);
      setInteriorTables(interior);
      setTerrazaTables(terraza);
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

  const handleAssign = async (waiterId: number, zone: 'interior' | 'terraza') => {
    const raw = zone === 'interior' ? intInput[waiterId] : extInput[waiterId];
    if (!raw?.trim()) return;
    const tableMap = zone === 'interior' ? interiorTables : terrazaTables;
    const nums = parseTableInput(raw);
    const docIds = nums
      .map(n => tableMap.find(t => t.numero === n)?.docId)
      .filter((id): id is number => id != null);
    if (docIds.length === 0) return;
    try {
      for (const docId of docIds) {
        await store.assignTable(waiterId, docId);
      }
      if (zone === 'interior') setIntInput(prev => ({ ...prev, [waiterId]: '' }));
      else setExtInput(prev => ({ ...prev, [waiterId]: '' }));
      await refresh();
      if (showAll) await fetchAll();
    } catch (e) {
      console.error('[WaiterPage] assign failed:', e);
    }
  };

  const handleUnassignTable = async (waiterId: number, tableDocId: number) => {
    try {
      await store.unassignTable(waiterId, tableDocId);
      await refresh();
      if (showAll) await fetchAll();
    } catch (e) {
      console.error('[WaiterPage] unassign failed:', e);
    }
  };

  const tableLabel = (docId: number): string => {
    const all = [...interiorTables, ...terrazaTables];
    const found = all.find(t => t.docId === docId);
    return found ? found.nombre.replace(/^Mesa\s*/, '') : `#${docId}`;
  };

  const tableZone = (docId: number): Zone | null => {
    if (interiorTables.some(t => t.docId === docId)) return 'interior';
    if (terrazaTables.some(t => t.docId === docId)) return 'terraza';
    return null;
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
                const intAssigned = assigned.filter(docId => tableZone(docId) === 'interior');
                const extAssigned = assigned.filter(docId => tableZone(docId) === 'terraza');
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

                    {/* Interior tables */}
                    <div>
                      <p className="text-xs font-medium text-slate-400 mb-1">Interior:</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {intAssigned.length === 0 && <span className="text-xs text-slate-500">—</span>}
                        {intAssigned.map(docId => (
                          <span
                            key={docId}
                            className="inline-flex items-center gap-1 bg-slate-600 text-slate-100 text-xs px-2 py-0.5 rounded-full"
                          >
                            {tableLabel(docId)}
                            <button
                              onClick={() => handleUnassignTable(w.id, docId)}
                              className="text-slate-400 hover:text-white ml-0.5"
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          className="input py-1 px-2 text-sm flex-1"
                          placeholder="Nºs (ej: 1,2,3 o 1-10)"
                          value={intInput[w.id] ?? ''}
                          onChange={e => setIntInput(prev => ({ ...prev, [w.id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') handleAssign(w.id, 'interior'); }}
                        />
                        <button onClick={() => handleAssign(w.id, 'interior')} className="btn-primary text-xs">
                          Asignar
                        </button>
                      </div>
                    </div>

                    {/* Terrace tables */}
                    <div>
                      <p className="text-xs font-medium text-slate-400 mb-1">Terraza:</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {extAssigned.length === 0 && <span className="text-xs text-slate-500">—</span>}
                        {extAssigned.map(docId => (
                          <span
                            key={docId}
                            className="inline-flex items-center gap-1 bg-slate-600 text-slate-100 text-xs px-2 py-0.5 rounded-full"
                          >
                            {tableLabel(docId)}
                            <button
                              onClick={() => handleUnassignTable(w.id, docId)}
                              className="text-slate-400 hover:text-white ml-0.5"
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          className="input py-1 px-2 text-sm flex-1"
                          placeholder="Nºs (ej: 1,2,3 o 1-10)"
                          value={extInput[w.id] ?? ''}
                          onChange={e => setExtInput(prev => ({ ...prev, [w.id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') handleAssign(w.id, 'terraza'); }}
                        />
                        <button onClick={() => handleAssign(w.id, 'terraza')} className="btn-primary text-xs">
                          Asignar
                        </button>
                      </div>
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
