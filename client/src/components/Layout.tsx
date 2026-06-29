import { Outlet, NavLink } from 'react-router-dom';
import { useWaiter } from '@/context/WaiterContext';

const navItems = [
  { to: '/tables', label: 'Mesas' },
  { to: '/config', label: 'Config' },
  { to: '/waiter', label: 'Camareros' },
] as const;

export function Layout() {
  const { currentWaiter } = useWaiter();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <span className="text-lg font-bold">CamareroVirtual</span>
        {currentWaiter && (
          <span className="text-sm text-slate-300">{currentWaiter.nombre}</span>
        )}
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
