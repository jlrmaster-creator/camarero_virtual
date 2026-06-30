import { Outlet, NavLink } from 'react-router-dom';
import { useDataSource } from '@/context/DataSourceContext';
import { useWaiter } from '@/context/WaiterContext';
import { useAuth } from '@/context/AuthContext';

export function Layout() {
  const { source, label } = useDataSource();
  const { currentWaiter } = useWaiter();
  const { user, company, role, logOut } = useAuth();

  const isFirebase = source === 'firebase';

  const isAdmin = role === 'admin';
  const navItems = [
    { to: '/tables', label: 'Mesas' },
    { to: '/config', label: 'Catálogo' },
  ];

  if (isAdmin || (!isFirebase)) {
    navItems.push({ to: '/waiter', label: 'Camareros' });
  }
  
  if (isFirebase && isAdmin) {
    navItems.push({ to: '/admin', label: 'Admin' });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-lg font-bold">CamareroVirtual</span>
          <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300">
            {label}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {currentWaiter && (
            <span className="text-sm text-slate-300">{currentWaiter.nombre}</span>
          )}
          {isFirebase && user && (
            <span className="text-xs text-slate-400 hidden sm:inline">
              {company?.name} / {role}
            </span>
          )}
          {!isAdmin && user && (
            <button onClick={() => { logOut(); }} className="text-red-400 hover:text-red-300 p-1.5 rounded hover:bg-red-900/20 transition-colors" title="Cerrar sesión">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-4 max-w-4xl mx-auto w-full">
        <Outlet />
      </main>

      <nav className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex sticky bottom-0 z-50">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex-1 text-center py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'text-blue-600 border-t-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
