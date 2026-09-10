import { X } from 'lucide-react'
import { useEffect } from 'react'

export default function Sheet({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="safe-bottom animate-pop relative max-h-[88vh] w-full max-w-md overflow-x-hidden overflow-y-auto rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 active:scale-90 dark:bg-slate-800 dark:text-slate-400"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-5 pb-8 pt-4">{children}</div>
      </div>
    </div>
  )
}
