import { useState } from 'react'
import { Utensils, Moon, Flame, Trophy, Armchair, Footprints, Music, ChevronRight } from 'lucide-react'
import { useStore } from '../lib/store'
import { average, resultCounts, currentStreak, bestStreak, stretchingRate, sessionCounts } from '../lib/stats'
import { formatLong, todayISO } from '../lib/format'
import StatCard from '../components/StatCard'
import ResultDonut from '../components/ResultDonut'
import SessionsRadarChart from '../components/SessionsRadarChart'
import YinYang from '../components/YinYang'
import Sheet from '../components/Sheet'
import EntryForm from '../components/EntryForm'

export default function Dashboard() {
  const { entries, upsertEntry } = useStore()
  const [editing, setEditing] = useState(false)

  const today = todayISO()
  const todayEntry = entries.find((e) => e.date === today)
  const avgMeals = average(entries.map((e) => e.meals))
  const avgSleep = average(entries.map((e) => e.sleep))
  const counts = resultCounts(entries)
  const streak = currentStreak(entries, (e) => e.stretching)
  const bestStretchingStreak = bestStreak(entries, (e) => e.stretching)
  const stretchRate = stretchingRate(entries)
  const sessions = sessionCounts(entries)
  const reposCount = sessions.find((s) => s.type === 'Repos')?.count ?? 0
  const autreCount = sessions.find((s) => s.type === 'Autre')?.count ?? 0
  const poleCount = sessions.find((s) => s.type === 'Pole')?.count ?? 0

  return (
    <div className="flex flex-col gap-5 px-4 pb-6 pt-4">
      <header className="flex items-center justify-between px-1">
        <p className="text-sm text-slate-400">{formatLong(today)}</p>
      </header>

      <button
        type="button"
        onClick={() => setEditing(true)}
        className="animate-pop flex items-center justify-between rounded-2xl bg-gradient-to-br from-accent to-accent-2 p-4 text-left text-on-accent shadow-lg shadow-accent-2/25 active:scale-[0.98]"
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-on-accent/70">Aujourd'hui</p>
          <p className="mt-0.5 text-base font-semibold">
            {todayEntry?.session ? `Séance : ${todayEntry.session}` : 'Log ta journée'}
          </p>
          <p className="mt-1 text-xs text-on-accent/80">
            {todayEntry ? 'Modifier le suivi du jour' : "Rien d'enregistré pour l'instant"}
          </p>
        </div>
        <ChevronRight size={20} />
      </button>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Repas moyen" value={avgMeals} unit="/j" icon={Utensils} />
        <StatCard label="Sommeil moyen" value={avgSleep} unit="h" icon={Moon} />
      </div>

      <div className="flex flex-col gap-2">
        <StatCard
          label="Étirements"
          value={streak}
          unit="j de suite"
          icon={Flame}
          className="border-2 border-accent"
        />
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center justify-center gap-1.5 rounded-xl bg-accent/10 py-2 text-xs font-semibold text-accent">
            <Trophy size={12} />
            Record : {bestStretchingStreak} j
          </div>
          <div className="flex items-center justify-center gap-1.5 rounded-xl bg-accent/10 py-2 text-xs font-semibold text-accent">
            <YinYang size={12} />
            {stretchRate}% ratio
          </div>
        </div>
      </div>

      <section className="animate-pop rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/60 dark:bg-neutral-800 dark:shadow-none">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Résultats des journées</h2>
        <ResultDonut counts={counts} />
      </section>

      <div className="flex flex-col gap-2">
        <section className="animate-pop rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/60 dark:bg-neutral-800 dark:shadow-none">
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Répartition des séances</h2>
          <SessionsRadarChart counts={sessions} />
        </section>

        <div className="grid grid-cols-3 gap-2">
          <div className="flex items-center justify-center gap-1.5 rounded-xl bg-accent/10 py-2 text-xs font-semibold text-accent">
            <Armchair size={12} />
            Repos : {reposCount}
          </div>
          <div className="flex items-center justify-center gap-1.5 rounded-xl bg-accent/10 py-2 text-xs font-semibold text-accent">
            <Footprints size={12} />
            Autre : {autreCount}
          </div>
          <div className="flex items-center justify-center gap-1.5 rounded-xl bg-accent/10 py-2 text-xs font-semibold text-accent">
            <Music size={12} />
            Pole : {poleCount}
          </div>
        </div>
      </div>

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
