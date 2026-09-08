export default function Toggle({ label, value, onChange, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex items-center gap-2.5 rounded-2xl border px-3.5 py-3 text-left transition-all active:scale-[0.97] ${
        value
          ? 'border-transparent bg-gradient-to-br from-cyan-500 to-indigo-500 text-white shadow-md shadow-indigo-500/20'
          : 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
      }`}
    >
      {Icon && <Icon size={18} strokeWidth={2.25} className={value ? 'text-white' : 'text-slate-400'} />}
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}
