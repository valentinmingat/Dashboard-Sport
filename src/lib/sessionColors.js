// Session types are drawn with a gradient outline (the session-outline utility
// in index.css); the label keeps the regular text color, so it stays readable
// whatever the gradient.
export const SESSION_COLORS = {
  'Jambes':
    'session-outline text-slate-800 dark:text-white [--outline-from:var(--color-blue-900)] [--outline-to:var(--color-blue-500)]',
  'Pecs / Épaules / Triceps':
    'session-outline text-slate-800 dark:text-white [--outline-from:var(--color-green-900)] [--outline-to:var(--color-emerald-600)]',
  'Pole':
    'session-outline text-slate-800 dark:text-white [--outline-from:var(--color-purple-800)] [--outline-to:var(--color-pink-500)]',
  'Biceps / Dos / Abdos':
    'session-outline text-slate-800 dark:text-white [--outline-from:var(--color-yellow-800)] [--outline-to:var(--color-yellow-600)]',
  'Autre':
    'session-outline text-slate-800 dark:text-white [--outline-from:var(--color-orange-700)] [--outline-to:var(--color-orange-500)]',
  'Repos':
    'session-outline text-slate-800 dark:text-white [--outline-from:var(--color-red-600)] [--outline-to:var(--color-red-400)]',
}
