// Color themes (see index.css). The choice is kept on this device; index.html
// applies it before the app loads so the screen never flashes the default.
export const THEMES = [
  { id: 'papaye', name: 'Argent & Papaye', bg: '#080808', swatches: ['#24292c', '#8a9597', '#ff8000', '#f2600c'] },
  { id: 'lime', name: 'Nuit & Lime', bg: '#16202c', swatches: ['#2c4262', '#b6c6da', '#ccff00', '#9ee01a'] },
  { id: 'rose', name: 'Argent & Rose', bg: '#080808', swatches: ['#24292c', '#8a9597', '#ffb8d4', '#ff1493'] },
]

export const DEFAULT_THEME = 'papaye'
const STORAGE_KEY = 'sport-track:theme'

export function currentTheme() {
  const id = document.documentElement.dataset.theme
  return THEMES.some((t) => t.id === id) ? id : DEFAULT_THEME
}

export function applyTheme(id) {
  const theme = THEMES.find((t) => t.id === id) ?? THEMES.find((t) => t.id === DEFAULT_THEME)
  document.documentElement.dataset.theme = theme.id
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.bg)
  try {
    localStorage.setItem(STORAGE_KEY, theme.id)
  } catch {
    // Private browsing or storage blocked: the theme still applies until the app closes.
  }
}
