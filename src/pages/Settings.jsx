import { useState } from 'react'
import { RotateCcw, Download, Upload, Cloud, CloudOff, Mail, Link2 } from 'lucide-react'
import { useStore } from '../lib/store'
import { todayISO } from '../lib/format'

export default function Settings() {
  const {
    entries,
    weight,
    updateGoal,
    resetAll,
    replaceAll,
    cloudEnabled,
    user,
    syncStatus,
    sendLoginLink,
    completeLoginWithLink,
    logout,
  } = useStore()
  const [form, setForm] = useState(weight)
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const [saved, setSaved] = useState(false)
  const [email, setEmail] = useState('')
  const [linkSent, setLinkSent] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [showPasteLink, setShowPasteLink] = useState(false)
  const [pastedLink, setPastedLink] = useState('')
  const [pasteError, setPasteError] = useState('')

  const handleSendLink = async () => {
    setLoginError('')
    try {
      await sendLoginLink(email.trim())
      setLinkSent(true)
    } catch {
      setLoginError("Impossible d'envoyer le lien. Vérifie l'adresse email.")
    }
  }

  const handleCompleteWithLink = async () => {
    setPasteError('')
    try {
      await completeLoginWithLink(email.trim(), pastedLink.trim())
    } catch {
      setPasteError('Lien invalide ou expiré. Redemande un nouveau lien puis recolle-le ici.')
    }
  }

  const handleExport = () => {
    const data = { entries, weight, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sport-track-sauvegarde-${todayISO()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        if (!Array.isArray(data.entries) || typeof data.weight !== 'object') throw new Error('invalid')
        if (confirm('Remplacer toutes les données actuelles par cette sauvegarde ?')) {
          replaceAll(data)
        }
      } catch {
        alert('Fichier de sauvegarde invalide.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-5 px-4 pb-6 pt-4">
      <header className="px-1">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Réglages</h1>
      </header>

      <section className="animate-pop flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/60 dark:bg-slate-800 dark:shadow-none">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Objectif de poids</h2>

        <Row label="Date de départ">
          <input type="date" value={form.startDate} onChange={(e) => set({ startDate: e.target.value })} className="input" />
        </Row>
        <Row label="Poids de départ (kg)">
          <input
            type="number"
            step="0.1"
            value={form.startWeight}
            onChange={(e) => set({ startWeight: Number(e.target.value) })}
            className="input"
          />
        </Row>
        <Row label="Date objectif">
          <input type="date" value={form.goalDate} onChange={(e) => set({ goalDate: e.target.value })} className="input" />
        </Row>
        <Row label="Poids objectif (kg)">
          <input
            type="number"
            step="0.1"
            value={form.goalWeight}
            onChange={(e) => set({ goalWeight: Number(e.target.value) })}
            className="input"
          />
        </Row>

        <button
          type="button"
          onClick={() => {
            updateGoal(form)
            setSaved(true)
            setTimeout(() => setSaved(false), 1500)
          }}
          className="mt-1 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-500 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/30 active:scale-[0.98]"
        >
          {saved ? 'Enregistré ✓' : 'Enregistrer'}
        </button>
      </section>

      {cloudEnabled && (
        <section className="animate-pop rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/60 dark:bg-slate-800 dark:shadow-none">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            {user ? <Cloud size={16} className="text-emerald-500" /> : <CloudOff size={16} className="text-slate-400" />}
            Synchronisation
          </h2>
          {user ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Connecté avec <span className="font-semibold">{user.email}</span>
                <br />
                <span className="text-xs text-slate-400">
                  {syncStatus === 'syncing' ? 'Synchronisation en cours…' : 'Sauvegarde automatique activée ✓'}
                </span>
              </p>
              <button
                type="button"
                onClick={logout}
                className="w-full rounded-2xl bg-slate-100 py-3 text-sm font-semibold text-slate-700 active:scale-[0.98] dark:bg-slate-700 dark:text-slate-200"
              >
                Se déconnecter
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {linkSent ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Lien envoyé à <span className="font-semibold">{email}</span>. Ouvre l'email et clique le lien pour activer
                  la sauvegarde automatique.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Connecte-toi pour sauvegarder automatiquement tes données en ligne et les retrouver sur un autre
                    appareil.
                  </p>
                  <input
                    type="email"
                    inputMode="email"
                    placeholder="ton@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                  />
                  {loginError && <p className="text-xs font-medium text-rose-500">{loginError}</p>}
                  <button
                    type="button"
                    onClick={handleSendLink}
                    disabled={!email.includes('@')}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-500 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/30 active:scale-[0.98] disabled:opacity-40"
                  >
                    <Mail size={15} />
                    Recevoir un lien de connexion
                  </button>
                </div>
              )}

              <div className="border-t border-slate-100 pt-3 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowPasteLink((v) => !v)}
                  className="text-xs font-medium text-indigo-500"
                >
                  {showPasteLink ? 'Masquer' : "J'ai déjà reçu un lien de connexion"}
                </button>
                {showPasteLink && (
                  <div className="mt-3 flex flex-col gap-3">
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Sur iPhone, l'app installée sur l'écran d'accueil et Safari ne partagent pas leurs données : si tu
                      t'es déjà connecté ailleurs, colle ici le lien reçu par email pour activer la sync dans cette app
                      aussi.
                    </p>
                    <input
                      type="email"
                      inputMode="email"
                      placeholder="ton@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input"
                    />
                    <input
                      type="text"
                      placeholder="Colle le lien reçu par email"
                      value={pastedLink}
                      onChange={(e) => setPastedLink(e.target.value)}
                      className="input"
                    />
                    {pasteError && <p className="text-xs font-medium text-rose-500">{pasteError}</p>}
                    <button
                      type="button"
                      onClick={handleCompleteWithLink}
                      disabled={!email.includes('@') || !pastedLink}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-800 py-3 text-sm font-semibold text-white active:scale-[0.98] disabled:opacity-40 dark:bg-slate-600"
                    >
                      <Link2 size={15} />
                      Se connecter avec ce lien
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      <section className="animate-pop rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/60 dark:bg-slate-800 dark:shadow-none">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Sauvegarde</h2>
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleExport}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 py-3 text-sm font-semibold text-slate-700 active:scale-[0.98] dark:bg-slate-700 dark:text-slate-200"
          >
            <Download size={15} />
            Exporter mes données
          </button>
          <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-100 py-3 text-sm font-semibold text-slate-700 active:scale-[0.98] dark:bg-slate-700 dark:text-slate-200">
            <Upload size={15} />
            Importer une sauvegarde
            <input type="file" accept="application/json" onChange={handleImport} className="hidden" />
          </label>
        </div>
        <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
          {user
            ? 'Sauvegarde locale complémentaire, en plus de la synchronisation en ligne ci-dessus.'
            : "Tes données ne sont stockées que sur cet appareil. Exporte une sauvegarde de temps en temps, et surtout avant de réinstaller l'app sur ton écran d'accueil."}
        </p>
      </section>

      <section className="animate-pop rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/60 dark:bg-slate-800 dark:shadow-none">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Données</h2>
        <button
          type="button"
          onClick={() => {
            if (confirm('Réinitialiser toutes les données ? Cette action est irréversible.')) resetAll()
          }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-50 py-3 text-sm font-semibold text-rose-600 active:scale-[0.98] dark:bg-rose-500/10 dark:text-rose-400"
        >
          <RotateCcw size={15} />
          Réinitialiser les données
        </button>
      </section>

      <p className="px-1 text-center text-xs text-slate-300 dark:text-slate-600">
        Sport Track · {user ? 'données synchronisées en ligne' : 'données stockées localement sur cet appareil'}
      </p>
    </div>
  )
}

function Row({ label, children }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</span>
      {children}
    </label>
  )
}
