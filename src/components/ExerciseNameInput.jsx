import { useLayoutEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

const LIST_HEIGHT = 224 // max-h-56
const SHEET_HEADER = 64

function scrollParent(node) {
  for (let el = node.parentElement; el; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el)
    if (overflowY === 'auto' || overflowY === 'scroll') return el
  }
  return null
}

// On a phone the keyboard covers the bottom of the screen, so the list opens
// above the field whenever there isn't room for it below.
function useOpensUpward(anchorRef, active) {
  const [upward, setUpward] = useState(false)

  useLayoutEffect(() => {
    if (!active) return undefined
    const update = () => {
      const anchor = anchorRef.current
      if (!anchor) return
      const rect = anchor.getBoundingClientRect()
      const viewport = window.visualViewport
      const viewTop = viewport ? viewport.offsetTop : 0
      const viewBottom = viewport ? viewport.offsetTop + viewport.height : window.innerHeight
      const parent = scrollParent(anchor)
      const top = Math.max(viewTop, parent ? parent.getBoundingClientRect().top + SHEET_HEADER : viewTop)
      const below = viewBottom - rect.bottom
      const above = rect.top - top
      setUpward(below < LIST_HEIGHT && above > below)
    }
    update()
    const viewport = window.visualViewport
    viewport?.addEventListener('resize', update)
    viewport?.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    document.addEventListener('scroll', update, true)
    return () => {
      viewport?.removeEventListener('resize', update)
      viewport?.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      document.removeEventListener('scroll', update, true)
    }
  }, [anchorRef, active])

  return upward
}

export default function ExerciseNameInput({ value, onChange, onPick, suggestionsFor, placeholder, autoFocus, clearable = false }) {
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)
  const suggestions = open ? suggestionsFor(value) : []
  const listShown = suggestions.length > 0
  const upward = useOpensUpward(inputRef, listShown)

  const pick = (name) => {
    onPick(name)
    setOpen(false)
    inputRef.current?.blur()
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        autoFocus={autoFocus}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="sentences"
        spellCheck={false}
        enterKeyHint="done"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false)
          if (e.key !== 'Enter') return
          e.preventDefault()
          if (listShown && value.trim()) pick(suggestions[0])
          else e.currentTarget.blur()
        }}
        className={`input ${clearable && value ? 'pr-10' : ''}`}
      />
      {clearable && value && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onChange('')}
          aria-label="Effacer"
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 active:scale-90"
        >
          <X size={15} />
        </button>
      )}
      {listShown && (
        <ul
          role="listbox"
          className={`absolute inset-x-0 z-[5] max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white py-1 shadow-lg shadow-slate-900/10 dark:border-neutral-700 dark:bg-neutral-800 dark:shadow-black/40 ${
            upward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
        >
          {suggestions.map((name) => (
            <li key={name}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(name)}
                className="block w-full truncate px-3.5 py-2.5 text-left text-sm text-slate-700 active:bg-slate-100 dark:text-slate-200 dark:active:bg-neutral-700"
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
