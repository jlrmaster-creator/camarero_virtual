import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createFirestoreStore, type FirestoreStore } from '@/services/firebaseStore';
import type { Waiter, CompanyUser } from '@/types/models';

export function AdminPage() {
  const { user, company, role, logOut, addUserToCompany, getCompanyUsers } = useAuth();
  const [fsStore, setFsStore] = useState<FirestoreStore | null>(null);
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const [newWaiterName, setNewWaiterName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (company) {
      const store = createFirestoreStore(company.id);
      setFsStore(store);
      store.waiters.getAll().then(setWaiters);
      getCompanyUsers().then(setCompanyUsers);
    }
  }, [company, getCompanyUsers]);

  async function addWaiter() {
    if (!fsStore || !newWaiterName.trim()) return;
    setBusy(true);
    setMsg('');
    try {
      await fsStore.waiters.create(newWaiterName.trim());
      setNewWaiterName('');
      const updated = await fsStore.waiters.getAll();
      setWaiters(updated);
      setMsg('Camarero añadido correctamente');
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Error al añadir camarero');
    } finally {
      setBusy(false);
    }
  }

  async function toggleShift(waiter: Waiter) {
    if (!fsStore) return;
    setBusy(true);
    setMsg('');
    try {
      if (waiter.activo) {
        await fsStore.waiters.endShift(waiter.id);
      } else {
        await fsStore.waiters.startShift(waiter.id);
      }
      const updated = await fsStore.waiters.getAll();
      setWaiters(updated);
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Error al cambiar turno');
    } finally {
      setBusy(false);
    }
  }

  async function addUser() {
    if (!newUserEmail.trim() || !newUserPass.trim()) return;
    setBusy(true);
    setMsg('');
    try {
      // Import dynamically to avoid circular deps
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      const { getAuthInstance } = await import('@/firebase/init');
      const auth = getAuthInstance();
      const cred = await createUserWithEmailAndPassword(auth, newUserEmail.trim(), newUserPass);
      await addUserToCompany(cred.user.uid, newUserEmail.trim(), 'waiter', newUserEmail.trim().split('@')[0]);
      setNewUserEmail('');
      setNewUserPass('');
      const updated = await getCompanyUsers();
      setCompanyUsers(updated);
      setMsg('Usuario añadido correctamente');
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Error al añadir usuario');
    } finally {
      setBusy(false);
    }
  }

  const isAdmin = role === 'admin';

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Administración</h1>
          {company && <p className="text-slate-400 text-sm">{company.name}</p>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">
            {user?.email} ({role})
          </span>
          <button onClick={logOut} className="text-sm text-red-400 hover:text-red-300">
            Cerrar sesión
          </button>
        </div>
      </div>

      {msg && (
        <div className={`px-4 py-2 rounded-lg text-sm ${
          msg.includes('Error') ? 'bg-red-900/50 text-red-200' : 'bg-green-900/50 text-green-200'
        }`}>
          {msg}
        </div>
      )}

      {/* ── Gestión de camareros (admin only) ── */}
      {isAdmin && (
        <section className="bg-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Camareros</h2>

          <div className="flex gap-2">
            <input
              type="text"
              value={newWaiterName}
              onChange={e => setNewWaiterName(e.target.value)}
              className="flex-1 bg-slate-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre del camarero"
              disabled={busy}
            />
            <button
              onClick={addWaiter}
              disabled={busy || !newWaiterName.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Añadir
            </button>
          </div>

          <div className="space-y-2">
            {waiters.map(w => (
              <div key={w.id} className="flex items-center justify-between bg-slate-700/50 rounded-lg px-4 py-3">
                <div>
                  <span className="text-white font-medium">{w.nombre}</span>
                  <span className={`ml-3 text-xs px-2 py-0.5 rounded-full ${
                    w.activo ? 'bg-green-600 text-green-100' : 'bg-slate-600 text-slate-300'
                  }`}>
                    {w.activo ? 'En turno' : 'Fuera de turno'}
                  </span>
                </div>
                <button
                  onClick={() => toggleShift(w)}
                  disabled={busy}
                  className={`text-sm px-3 py-1 rounded-lg transition-colors ${
                    w.activo
                      ? 'bg-red-600/20 text-red-300 hover:bg-red-600/40'
                      : 'bg-green-600/20 text-green-300 hover:bg-green-600/40'
                  }`}
                >
                  {w.activo ? 'Finalizar turno' : 'Iniciar turno'}
                </button>
              </div>
            ))}
            {waiters.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-4">No hay camareros registrados</p>
            )}
          </div>
        </section>
      )}

      {/* ── Usuarios del sistema (admin only) ── */}
      {isAdmin && (
        <section className="bg-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Usuarios del sistema</h2>

          <div className="flex gap-2">
            <input
              type="email"
              value={newUserEmail}
              onChange={e => setNewUserEmail(e.target.value)}
              className="flex-1 bg-slate-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Email del nuevo usuario"
              disabled={busy}
            />
            <input
              type="password"
              value={newUserPass}
              onChange={e => setNewUserPass(e.target.value)}
              className="w-36 bg-slate-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Contraseña"
              disabled={busy}
            />
            <button
              onClick={addUser}
              disabled={busy || !newUserEmail.trim() || !newUserPass.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Añadir
            </button>
          </div>

          <div className="space-y-2">
            {companyUsers.map(u => (
              <div key={u.id} className="flex items-center justify-between bg-slate-700/50 rounded-lg px-4 py-3">
                <div>
                  <span className="text-white">{u.displayName}</span>
                  <span className="text-slate-400 text-sm ml-2">{u.email}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  u.role === 'admin' ? 'bg-purple-600 text-purple-100' : 'bg-blue-600 text-blue-100'
                }`}>
                  {u.role === 'admin' ? 'Admin' : 'Camarero'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {!isAdmin && (
        <div className="bg-slate-800 rounded-xl p-6 text-center">
          <p className="text-slate-400">No tienes permisos de administrador.</p>
        </div>
      )}
    </div>
  );
}
