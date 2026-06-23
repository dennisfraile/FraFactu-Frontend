import { useThemeStore } from './theme-store'

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme)
  const toggle = useThemeStore((s) => s.toggle)
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
      className="rounded-md border border-hairline px-2 py-1 text-sm hover:bg-sello/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sello"
    >
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  )
}
