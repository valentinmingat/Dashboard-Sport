export default function SegmentedControl({ options, value, onChange, colorFor, multiple = false }) {
  const isActive = (opt) => (multiple ? value.includes(opt) : value === opt)
  const select = (opt) => {
    if (!multiple) onChange(opt)
    else onChange(isActive(opt) ? value.filter((v) => v !== opt) : [...value, opt])
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = isActive(opt)
        return (
          <button
            key={opt}
            type="button"
            onClick={() => select(opt)}
            className={`rounded-full px-3.5 py-2 text-sm font-medium transition-all active:scale-[0.96] ${
              active
                ? `${colorFor ? colorFor(opt) : 'bg-accent text-on-accent'} shadow-sm`
                : 'bg-slate-100 text-slate-500 dark:bg-neutral-800 dark:text-slate-400'
            }`}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}
