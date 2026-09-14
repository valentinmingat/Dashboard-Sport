import { Component } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Sport Track crashed:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center dark:bg-neutral-950">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-500 dark:bg-rose-500/10">
          <AlertTriangle size={26} />
        </div>
        <div>
          <h1 className="text-base font-semibold text-slate-800 dark:text-slate-100">Une erreur est survenue</h1>
          <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">
            L'application a rencontré un problème inattendu. Tes données restent en sécurité.
          </p>
          <p className="mt-2 max-w-xs break-words text-xs text-slate-400 dark:text-slate-600">
            {this.state.error?.message || String(this.state.error)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-red-600/30 active:scale-[0.98]"
        >
          <RotateCcw size={15} />
          Recharger l'application
        </button>
      </div>
    )
  }
}
