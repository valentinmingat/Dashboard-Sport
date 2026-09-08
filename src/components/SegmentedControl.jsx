export default function SegmentedControl({ options, value, onChange, colorFor }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`rounded-full px-3.5 py-2 text-sm font-medium transition-all active:scale-[0.96] ${
              active
                ? `${colorFor ? colorFor(opt) : 'bg-indigo-500 text-white'} shadow-sm`
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}
