import type { Zone } from '@/types/models';

interface ZoneTabsProps {
  active: Zone;
  onChange: (zone: Zone) => void;
}

export function ZoneTabs({ active, onChange }: ZoneTabsProps) {
  return (
    <div className="flex gap-2 mb-4">
      <button
        onClick={() => onChange('interior')}
        className={`flex-1 py-3 rounded-xl text-center font-bold text-sm transition-colors ${
          active === 'interior'
            ? 'bg-blue-600 text-white'
            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
        }`}
      >
        Interior
      </button>
      <button
        onClick={() => onChange('terraza')}
        className={`flex-1 py-3 rounded-xl text-center font-bold text-sm transition-colors ${
          active === 'terraza'
            ? 'bg-blue-600 text-white'
            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
        }`}
      >
        Terraza
      </button>
    </div>
  );
}
