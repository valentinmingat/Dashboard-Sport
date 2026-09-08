import { Minus, Plus } from 'lucide-react'

export default function NumberStepper({ value, onChange, step = 1, min = 0, max = 24, suffix = '' }) {
  const clamp = (v) => Math.min(max, Math.max(min, v))
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-2 py-2 dark:border-slate-700 dark:bg-slate-800">
      <button
        type="button"
        onClick={() => onChange(clamp(Math.round((value - step) * 100) / 100))}
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 active:scale-90 dark:bg-slate-700 dark:text-slate-200"
      >
        <Minus size={16} strokeWidth={2.5} />
      </button>
      <span className="text-base font-semibold tabular-nums text-slate-800 dark:text-slate-100">
        {value}
        {suffix}
      </span>
      <button
        type="button"
        onClick={() => onChange(clamp(Math.round((value + step) * 100) / 100))}
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 active:scale-90 dark:bg-slate-700 dark:text-slate-200"
      >
        <Plus size={16} strokeWidth={2.5} />
      </button>
    </div>
  )
}
