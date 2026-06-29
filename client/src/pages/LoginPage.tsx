import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

type Mode = 'login' | 'register';

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn, registerCompany } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        if (!companyName.trim()) { setError('El nombre de la empresa es obligatorio'); setBusy(false); return; }
        await registerCompany(companyName.trim(), email, password);
      }
      navigate('/tables', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md bg-slate-800 rounded-xl p-8 shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Camarero Virtual</h1>
          <p className="text-slate-400 mt-1">
            {mode === 'login' ? 'Inicia sesión en tu empresa' : 'Registra tu empresa'}
          </p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-600 text-red-200 px-4 py-2 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm text-slate-300 mb-1">Nombre de la empresa</label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Bar La Esquina"
                disabled={busy}
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-slate-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@ejemplo.com"
              required
              disabled={busy}
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
              disabled={busy}
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {busy ? 'Procesando...' : mode === 'login' ? 'Iniciar sesión' : 'Crear empresa'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          {mode === 'login' ? (
            <>
              ¿No tienes cuenta?{' '}
              <button onClick={() => { setMode('register'); setError(''); }} className="text-blue-400 hover:underline">
                Registra tu empresa
              </button>
            </>
          ) : (
            <>
              ¿Ya tienes cuenta?{' '}
              <button onClick={() => { setMode('login'); setError(''); }} className="text-blue-400 hover:underline">
                Inicia sesión
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
