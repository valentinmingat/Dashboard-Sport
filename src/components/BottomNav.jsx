import { Home, NotebookPen, LineChart, Settings } from 'lucide-react'

const TABS = [
  { id: 'dashboard', label: 'Accueil', icon: Home },
  { id: 'journal', label: 'Journal', icon: NotebookPen },
  { id: 'weight', label: 'Poids', icon: LineChart },
  { id: 'settings', label: 'Réglages', icon: Settings },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-slate-200/80 bg-white/85 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/85">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-1 pt-1.5">
        {TABS.map((tab) => {
          const isActive = active === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className="flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 transition-transform active:scale-95"
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.4 : 2}
                className={isActive ? 'text-indigo-500' : 'text-slate-400 dark:text-slate-500'}
              />
              <span
                className={`text-[11px] font-medium ${
                  isActive ? 'text-indigo-500' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
