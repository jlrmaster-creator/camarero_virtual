import { useState } from 'react';
import { useSession } from '@/context/SessionContext';

export function SessionPage() {
  const { createSession, joinSession, loading } = useSession();
  const [codigo, setCodigo] = useState('');
  const [mode, setMode] = useState<'start' | 'join' | 'created'>('start');
  const [createdCode, setCreatedCode] = useState('');
  const [error, setError] = useState('');

  const handleCreate = async () => {
    try {
      setError('');
      const s = await createSession();
      setCreatedCode(s.codigo);
      setMode('created');
    } catch {
      setError('Error al crear la sesión');
    }
  };

  const handleJoin = async () => {
    if (!codigo.trim()) return;
    try {
      setError('');
      await joinSession(codigo.trim().toUpperCase());
    } catch {
      setError('Código incorrecto o sesión no encontrada');
    }
  };

  if (mode === 'created') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-900 text-white">
        <h1 className="text-2xl font-bold mb-2">Sesión Creada</h1>
        <p className="text-slate-400 text-center mb-6">
          Comparte este código con los demás camareros
        </p>
        <div className="text-6xl font-extrabold tracking-widest bg-slate-800 px-8 py-6 rounded-2xl mb-6 select-all">
          {createdCode}
        </div>
        <p className="text-sm text-slate-500 text-center mb-8">
          Cada camarero debe introducir este código en "Unirse a sesión" desde su dispositivo
        </p>
        <button
          onClick={handleCreate}
          className="btn-primary text-lg px-8 py-3"
        >
          Comenzar Jornada
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-900 text-white">
      <h1 className="text-3xl font-bold mb-2">CamareroVirtual</h1>
      <p className="text-slate-400 mb-8 text-center">
        Gestión de mesas para bares y restaurantes
      </p>

      {error && (
        <div className="bg-red-500/20 text-red-300 px-4 py-2 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {mode === 'start' && (
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <button
            onClick={() => setMode('join')}
            className="bg-blue-600 text-white py-4 rounded-xl text-lg font-bold active:bg-blue-700 transition-colors"
          >
            Unirse a Sesión
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="bg-green-600 text-white py-4 rounded-xl text-lg font-bold active:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Comenzar el Día'}
          </button>
        </div>
      )}

      {mode === 'join' && (
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <h2 className="text-xl font-semibold text-center">Introduce el código</h2>
          <input
            className="input text-center text-2xl tracking-widest uppercase bg-slate-800 border-slate-600 text-white"
            placeholder="ABC12"
            maxLength={5}
            value={codigo}
            onChange={e => setCodigo(e.target.value.toUpperCase())}
            autoFocus
          />
          <button
            onClick={handleJoin}
            disabled={loading || codigo.length !== 5}
            className="bg-blue-600 text-white py-4 rounded-xl text-lg font-bold active:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Uniendo...' : 'Entrar'}
          </button>
          <button
            onClick={() => setMode('start')}
            className="text-slate-400 text-sm"
          >
            Volver
          </button>
        </div>
      )}
    </div>
  );
}
