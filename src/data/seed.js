// Données de départ reprises du fichier Dashboard_sport.xlsx
// (feuilles "Suivi journalier" et "KPI")

export const SESSION_TYPES = [
  'Jambes',
  'Pecs / Épaules / Triceps',
  'Biceps / Dos / Abdos',
  'Autre',
  'Repos',
]

export const RESULTS = ['Bon', 'Neutre', 'Mauvais']

export const seedEntries = [
  { date: '2026-08-29', stretching: true, session: 'Jambes', meals: 3, gainer: false, creatine: true, collagen: true, sleep: 8, result: 'Bon', notes: '' },
  { date: '2026-08-30', stretching: true, session: 'Repos', meals: 4, gainer: true, creatine: true, collagen: false, sleep: 8, result: 'Bon', notes: '' },
  { date: '2026-08-31', stretching: true, session: 'Pecs / Épaules / Triceps', meals: 4, gainer: true, creatine: true, collagen: false, sleep: 8, result: 'Bon', notes: '' },
  { date: '2026-09-01', stretching: true, session: 'Biceps / Dos / Abdos', meals: 4, gainer: true, creatine: true, collagen: false, sleep: 8, result: 'Bon', notes: '' },
  { date: '2026-09-02', stretching: true, session: 'Repos', meals: 3, gainer: false, creatine: true, collagen: true, sleep: 8, result: 'Bon', notes: '' },
  { date: '2026-09-03', stretching: true, session: 'Repos', meals: 4, gainer: true, creatine: true, collagen: false, sleep: 8, result: 'Bon', notes: '' },
  { date: '2026-09-04', stretching: true, session: 'Pecs / Épaules / Triceps', meals: 3, gainer: true, creatine: true, collagen: false, sleep: 8, result: 'Bon', notes: '' },
  { date: '2026-09-05', stretching: true, session: 'Repos', meals: 4, gainer: true, creatine: true, collagen: false, sleep: 10, result: 'Bon', notes: '' },
  { date: '2026-09-06', stretching: true, session: 'Jambes', meals: 3, gainer: true, creatine: true, collagen: false, sleep: 9, result: 'Bon', notes: '' },
  { date: '2026-09-07', stretching: true, session: 'Repos', meals: 3, gainer: false, creatine: true, collagen: false, sleep: 8, result: 'Bon', notes: '' },
  { date: '2026-09-08', stretching: true, session: null, meals: null, gainer: null, creatine: null, collagen: null, sleep: 8.5, result: null, notes: '' },
].map((e, i) => ({ id: `seed-${i + 1}`, ...e }))

export const seedWeight = {
  startDate: '2026-08-29',
  startWeight: 58,
  goalDate: '2027-08-29',
  goalWeight: 65,
  unit: 'kg',
  logs: [
    { id: 'w-seed-1', date: '2026-08-29', weight: 58 },
  ],
}
