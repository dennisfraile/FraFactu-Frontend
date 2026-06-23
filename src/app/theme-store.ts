import { create } from 'zustand'

type Theme = 'light' | 'dark'
const KEY = 'frafactu-theme'

function apply(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

function initialTheme(): Theme {
  const saved = localStorage.getItem(KEY) as Theme | null
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

interface ThemeState {
  theme: Theme
  toggle: () => void
  init: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  toggle: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem(KEY, next)
    apply(next)
    set({ theme: next })
  },
  init: () => {
    const theme = initialTheme()
    apply(theme)
    set({ theme })
  },
}))
