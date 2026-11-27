import { useState } from 'react'
import { Check } from 'lucide-react'
import { THEMES, applyTheme, currentTheme } from '../lib/theme'

export default function ThemePicker() {
  const [selected, setSelected] = useState(currentTheme)

  return (
    <div role="radiogroup" aria-label="Thème" className="flex flex-col gap-2">
      {THEMES.map((theme) => {
        const active = theme.id === selected
        return (
          <button
            key={theme.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => {
              applyTheme(theme.id)
              setSelected(theme.id)
            }}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors active:scale-[0.98] ${
              active ? 'border-accent bg-accent/10' : 'border-neutral-700'
            }`}
          >
            <span className="flex shrink-0 overflow-hidden rounded-lg border border-white/15" aria-hidden="true">
              {[theme.bg, ...theme.swatches].map((color) => (
                <span key={color} className="h-7 w-4" style={{ backgroundColor: color }} />
              ))}
            </span>
            <span className="flex-1 text-sm font-medium text-slate-100">{theme.name}</span>
            {active && <Check size={16} strokeWidth={2.5} className="text-accent" />}
          </button>
        )
      })}
    </div>
  )
}
