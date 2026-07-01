import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createFirestoreStore, type FirestoreStore } from '@/services/firebaseStore';
import * as authService from '@/firebase/auth';
import { firebaseConfig } from '@/firebase/config';
import { generateReportHtml, printReport } from '@/utils/report';
import type { Waiter, CompanyUser } from '@/types/models';

interface EditingWaiter {
  id: string;
  nombre: string;
  activo: boolean;
}

export function AdminPage() {
  const { user, company, role, roleReady, logOut } = useAuth();
  const [fsStore, setFsStore] = useState<FirestoreStore | null>(null);
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const [newNombre, setNewNombre] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPass, setNewPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [editing, setEditing] = useState<EditingWaiter | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editPass, setEditPass] = useState('');

  const loadData = useCallback(async () => {
    if (!company || !fsStore) return;
    let [w, u] = await Promise.all([
      fsStore.waiters.getAll(),
      authService.getCompanyUsers(company.id),
    ]);

    // Cleanup bugged "NaN" document if it exists
    const nanDoc = w.find(waiter => String(waiter.id) === 'NaN');
    if (nanDoc) {
      await fsStore.waiters.remove('NaN' as unknown as number).catch(() => {});
      w = w.filter(waiter => String(waiter.id) !== 'NaN');
    }

    setWaiters(w);
    setCompanyUsers(u);
  }, [company, fsStore]);

  useEffect(() => {
    if (company) {
      const store = createFirestoreStore(company.id);
      setFsStore(store);
    }
  }, [company]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function getUser(waiter: Waiter): CompanyUser | undefined {
    return companyUsers.find(u => waiter.auth_uid ? u.id === waiter.auth_uid : u.displayName === waiter.nombre);
  }

  async function addWaiter() {
    if (!fsStore || !newNombre.trim() || !newEmail.trim() || !newPass.trim()) return;
    setBusy(true);
    setMsg('');
    try {
      // Use Firebase Auth REST API to create user without affecting current session
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: newEmail.trim(), password: newPass, returnSecureToken: true }),
        },
      );
      const body = await res.json();
      if (res.status !== 200) {
        throw new Error(body.error?.message === 'EMAIL_EXISTS' ? 'email-already-in-use' : body.error?.message ?? 'Error al crear usuario');
      }
      const uid: string = body.localId;

      await Promise.all([
        fsStore.waiters.create(newNombre.trim(), uid),
        authService.addCompanyUser(company!.id, uid, newEmail.trim(), 'waiter', newNombre.trim()),
        authService.addUserCompanyLookup(uid, company!.id),
      ]);

      setNewNombre('');
      setNewEmail('');
      setNewPass('');
      await loadData();
      setMsg('Camarero creado correctamente');
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : 'Error al crear camarero';
      if (m.includes('email-already-in-use')) {
        setMsg('Ese email ya está en uso por otro usuario');
      } else {
        setMsg(m);
      }
    } finally {
      setBusy(false);
    }
  }

  async function toggleBlock(waiter: Waiter) {
    if (!fsStore || !company) return;
    setBusy(true);
    setMsg('');
    try {
      const u = getUser(waiter);
      if (!u) { setMsg('Usuario no encontrado'); setBusy(false); return; }
      const newBlocked = !u.bloqueado;
      await authService.updateCompanyUser(company.id, u.id, { bloqueado: newBlocked });
      await loadData();
      setMsg(newBlocked ? 'Camarero bloqueado' : 'Camarero desbloqueado');
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Error al bloquear');
    } finally {
      setBusy(false);
    }
  }

  async function deleteWaiter(waiter: Waiter) {
    if (!fsStore || !company) return;
    if (!window.confirm(`¿Eliminar a ${waiter.nombre}?`)) return;
    setBusy(true);
    setMsg('');
    try {
      const u = getUser(waiter);
      if (u) {
        await authService.updateCompanyUser(company.id, u.id, { eliminado: true });
      }
      // Remove waiter document from Firestore
      await fsStore.waiters.remove(waiter.id as unknown as number);
      await loadData();
      setMsg('Camarero eliminado');
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setBusy(false);
    }
  }

  function startEdit(waiter: Waiter) {
    setEditing({ id: String(waiter.id), nombre: waiter.nombre, activo: waiter.activo });
    setEditNombre(waiter.nombre);
    setEditPass('');
  }

  async function saveEdit() {
    if (!fsStore || !editing || !editNombre.trim() || !company) return;
    setBusy(true);
    setMsg('');
    try {
      const waiter = waiters.find(w => String(w.id) === editing.id);
      if (!waiter) { setMsg('Camarero no encontrado'); setBusy(false); return; }

      // Update auth user record
      const u = getUser(waiter);
      if (u) {
        await authService.updateCompanyUser(company.id, u.id, { displayName: editNombre.trim() });
      }

      // Update waiter document in Firestore
      await fsStore.waiters.update(editing.id as unknown as number, {
        nombre: editNombre.trim(),
        activo: editing.activo,
      });

      if (editPass.trim()) {
        // Can't reset password from client without reauth - skip for now
      }

      setEditing(null);
      setEditPass('');
      await loadData();
      setMsg('Camarero actualizado');
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      setBusy(false);
    }
  }

  async function closeAllShifts() {
    if (!fsStore || !company) return;
    if (!window.confirm('¿Estás seguro de que quieres cerrar el turno de TODOS los camareros activos?')) return;
    setBusy(true);
    setMsg('');
    try {
      const activeWaitersList = waiters.filter(w => w.activo);
      await Promise.all(
        activeWaitersList.map(w => fsStore.waiters.update(w.id, { activo: false }))
      );
      await loadData();
      setMsg(`Se han cerrado ${activeWaitersList.length} turnos.`);
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Error al cerrar turnos');
    } finally {
      setBusy(false);
    }
  }

  const isAdmin = role === 'admin';

  const activeUsers = companyUsers.filter(u => !u.eliminado && u.role === 'waiter');

  async function handleDailyReport() {
    if (!fsStore || !company) return;
    setBusy(true);
    setMsg('');
    try {
      const [occupations, tables, waiters] = await Promise.all([
        fsStore.occupations.getAllFinished(),
        fsStore.tables.getAll(),
        fsStore.waiters.getAll(),
      ]);
      const tableNames: Record<number, string> = {};
      for (const t of tables) {
        tableNames[t.id] = t.nombre;
      }
      const waiterNames: Record<number | string, string> = {};
      for (const w of waiters) {
        waiterNames[w.id] = w.nombre;
      }
      const html = generateReportHtml({
        companyName: company.name,
        occupations,
        waiterNames,
        tableNames,
      });
      printReport(html);
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Error al generar el informe');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Configuración</h1>
          {company && <p className="text-slate-500 dark:text-slate-400 text-sm">{company.name}</p>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">
            {user?.email} ({role})
          </span>
          <button onClick={logOut} className="text-red-400 hover:text-red-300 p-2 rounded hover:bg-red-900/20 transition-colors" title="Cerrar sesión">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </div>

      {msg && (
        <div className={`px-4 py-2 rounded-lg text-sm ${
          msg.includes('Error') || msg.includes('uso') ? 'bg-red-900/50 text-red-200' : 'bg-green-900/50 text-green-200'
        }`}>
          {msg}
        </div>
      )}

      {isAdmin && (
        <>
          <section className="bg-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">Añadir camarero</h2>
            <p className="text-sm text-slate-400">Crea un camarero con nombre, email y contraseña para que pueda acceder a la app.</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={newNombre}
                onChange={e => setNewNombre(e.target.value)}
                className="bg-slate-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre"
                disabled={busy}
              />
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                className="bg-slate-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Email (usuario)"
                disabled={busy}
              />
              <input
                type="password"
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                className="bg-slate-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contraseña"
                disabled={busy}
              />
            </div>
            <button
              onClick={addWaiter}
              disabled={busy || !newNombre.trim() || !newEmail.trim() || !newPass.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Crear camarero
            </button>
          </section>

          <section className="bg-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-white">
                Camareros ({activeUsers.length})
              </h2>
              {waiters.some(w => w.activo) && (
                <button
                  onClick={closeAllShifts}
                  disabled={busy}
                  className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                >
                  Cerrar todos los turnos
                </button>
              )}
            </div>

            {activeUsers.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-4">No hay camareros. Crea el primero arriba.</p>
            )}

            <div className="space-y-2">
              {waiters.map(w => {
                const u = getUser(w);
                const isBlocked = u?.bloqueado;
                const isDeleted = u?.eliminado;

                return (
                  <div key={w.id} className="bg-slate-700/50 rounded-lg px-4 py-3">
                    {editing?.id === String(w.id) ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editNombre}
                          onChange={e => setEditNombre(e.target.value)}
                          className="w-full bg-slate-600 text-white rounded px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={busy}
                        />
                        <input
                          type="password"
                          value={editPass}
                          onChange={e => setEditPass(e.target.value)}
                          className="w-full bg-slate-600 text-white rounded px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Nueva contraseña"
                          disabled={busy}
                        />
                        <label className="flex items-center gap-2 text-sm text-slate-300">
                          <input
                            type="checkbox"
                            checked={editing.activo}
                            onChange={e => setEditing({ ...editing, activo: e.target.checked })}
                            disabled={busy}
                          />
                          Activo (en turno)
                        </label>
                        <div className="flex gap-2">
                          <button onClick={saveEdit} disabled={busy} className="bg-green-600 text-white text-xs px-3 py-1 rounded">
                            Guardar
                          </button>
                          <button onClick={() => setEditing(null)} className="bg-slate-600 text-white text-xs px-3 py-1 rounded">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-white font-medium ${isDeleted ? 'line-through text-slate-500' : ''}`}>
                            {w.nombre}
                          </span>
                          {u && (
                            <span className="text-slate-400 text-xs truncate hidden sm:inline">{u.email}</span>
                          )}
                          {isDeleted && (
                            <span className="text-xs bg-red-900/50 text-red-300 px-2 py-0.5 rounded-full">Eliminado</span>
                          )}
                          {isBlocked && !isDeleted && (
                            <span className="text-xs bg-yellow-900/50 text-yellow-300 px-2 py-0.5 rounded-full">Bloqueado</span>
                          )}
                          {w.activo && !isBlocked && !isDeleted && (
                            <span className="text-xs bg-green-600 text-green-100 px-2 py-0.5 rounded-full">En turno</span>
                          )}
                        </div>
                        {!isDeleted && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => startEdit(w)}
                              disabled={busy}
                              className="bg-blue-600/20 text-blue-300 hover:bg-blue-600/40 text-xs px-2 py-1 rounded"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => toggleBlock(w)}
                              disabled={busy}
                              className={`text-xs px-2 py-1 rounded ${
                                isBlocked
                                  ? 'bg-green-600/20 text-green-300 hover:bg-green-600/40'
                                  : 'bg-yellow-600/20 text-yellow-300 hover:bg-yellow-600/40'
                              }`}
                            >
                              {isBlocked ? 'Desbloquear' : 'Bloquear'}
                            </button>
                            <button
                              onClick={() => deleteWaiter(w)}
                              disabled={busy}
                              className="bg-red-600/20 text-red-300 hover:bg-red-600/40 text-xs px-2 py-1 rounded"
                            >
                              Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="bg-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-red-400">Resetear mesas</h2>
            <p className="text-sm text-slate-400">
              Elimina todos los pedidos, clientes y comensales de todas las mesas. No afecta al catálogo de productos ni a los camareros.
              Esta acción no se puede deshacer.
            </p>
            <button
              onClick={async () => {
                if (!window.confirm('¿Estás seguro de que quieres resetear TODAS las mesas? Se perderán todos los pedidos, clientes y comensales.')) return;
                if (!window.confirm('Esta acción no se puede deshacer. ¿Continuar?')) return;
                setBusy(true);
                setMsg('');
                try {
                  await fsStore!.resetAllTables();
                  setMsg('Todas las mesas se han reseteado correctamente.');
                } catch (err: unknown) {
                  setMsg(err instanceof Error ? err.message : 'Error al resetear mesas');
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy}
              className="bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {busy ? 'Reseteando...' : 'Resetear mesas'}
            </button>
          </section>

          <section className="bg-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">Informe del día</h2>
            <p className="text-sm text-slate-400">
              Genera un PDF con el resumen de facturación del día, incluyendo el desglose de productos vendidos para control de stock.
            </p>
            <button
              onClick={handleDailyReport}
              disabled={busy}
              className="bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {busy ? 'Generando...' : 'Generar informe del día'}
            </button>
          </section>
        </>
      )}

      {!roleReady && (
        <div className="bg-slate-800 rounded-xl p-6 text-center">
          <p className="text-slate-400">Cargando permisos...</p>
        </div>
      )}

      {roleReady && !isAdmin && (
        <div className="bg-slate-800 rounded-xl p-6 text-center">
          <p className="text-slate-400">No tienes permisos de administrador.</p>
        </div>
      )}
    </div>
  );
}
