import { useState } from 'react'
import { Utensils, Moon, Flame, Dumbbell, Trophy, ChevronRight } from 'lucide-react'
import { useStore } from '../lib/store'
import { average, resultCounts, currentStreak, bestStreak, sessionCounts } from '../lib/stats'
import { formatLong, todayISO } from '../lib/format'
import StatCard from '../components/StatCard'
import ResultDonut from '../components/ResultDonut'
import SessionsBarChart from '../components/SessionsBarChart'
import WeightChart from '../components/WeightChart'
import Sheet from '../components/Sheet'
import EntryForm from '../components/EntryForm'

export default function Dashboard({ onNavigate }) {
  const { entries, weight, upsertEntry } = useStore()
  const [editing, setEditing] = useState(false)

  const today = todayISO()
  const todayEntry = entries.find((e) => e.date === today)
  const avgMeals = average(entries.map((e) => e.meals))
  const avgSleep = average(entries.map((e) => e.sleep))
  const counts = resultCounts(entries)
  const streak = currentStreak(entries, (e) => e.stretching)
  const bestStretchingStreak = bestStreak(entries, (e) => e.stretching)
  const attendance = currentStreak(entries, () => true)
  const bestAttendanceStreak = bestStreak(entries, () => true)
  const sessions = sessionCounts(entries)

  return (
    <div className="flex flex-col gap-5 px-4 pb-6 pt-4">
      <header className="flex items-center justify-between px-1">
        <p className="text-sm text-slate-400">{formatLong(today)}</p>
      </header>

      <button
        type="button"
        onClick={() => setEditing(true)}
        className="animate-pop flex items-center justify-between rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-500 p-4 text-left text-white shadow-lg shadow-indigo-500/25 active:scale-[0.98]"
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-white/70">Aujourd'hui</p>
          <p className="mt-0.5 text-base font-semibold">
            {todayEntry?.session ? `Séance : ${todayEntry.session}` : 'Log ta journée'}
          </p>
          <p className="mt-1 text-xs text-white/80">
            {todayEntry ? 'Modifier le suivi du jour' : "Rien d'enregistré pour l'instant"}
          </p>
        </div>
        <ChevronRight size={20} />
      </button>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Repas moyen" value={avgMeals} unit="/j" icon={Utensils} accent="from-amber-400 to-orange-600" />
        <StatCard label="Sommeil moyen" value={avgSleep} unit="h" icon={Moon} accent="from-blue-500 to-violet-600" />

        <div className="flex flex-col gap-2">
          <StatCard label="Étirements" value={streak} unit="j de suite" icon={Flame} accent="from-rose-500 to-orange-500" />
          <div className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-50 py-2 text-xs font-semibold text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
            <Trophy size={12} />
            Record : {bestStretchingStreak} j
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <StatCard label="Assiduité" value={attendance} unit="j de suite" icon={Dumbbell} accent="from-rose-500 to-pink-600" />
          <div className="flex items-center justify-center gap-1.5 rounded-xl bg-pink-50 py-2 text-xs font-semibold text-pink-600 dark:bg-pink-500/10 dark:text-pink-400">
            <Trophy size={12} />
            Record : {bestAttendanceStreak} j
          </div>
        </div>
      </div>

      <section className="animate-pop rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/60 dark:bg-slate-800 dark:shadow-none">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Résultats des journées</h2>
        <ResultDonut counts={counts} />
      </section>

      <section className="animate-pop rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/60 dark:bg-slate-800 dark:shadow-none">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Répartition des séances</h2>
        <SessionsBarChart counts={sessions} />
      </section>

      <section className="animate-pop rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/60 dark:bg-slate-800 dark:shadow-none">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Progression du poids</h2>
          <button type="button" onClick={() => onNavigate('weight')} className="text-xs font-medium text-indigo-500">
            Détails
          </button>
        </div>
        <WeightChart weight={weight} />
      </section>

      <Sheet open={editing} title="Journal du jour" onClose={() => setEditing(false)}>
        <EntryForm
          date={today}
          initial={todayEntry}
          onCancel={() => setEditing(false)}
          onSave={(entry) => {
            upsertEntry(entry)
            setEditing(false)
          }}
        />
      </Sheet>
    </div>
  )
}
