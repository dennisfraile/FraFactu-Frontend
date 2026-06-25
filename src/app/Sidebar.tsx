import { NavLink } from 'react-router-dom'
import { navSections } from './nav-config'
export function Sidebar() {
  return (
    <nav className="flex w-56 flex-col gap-1 border-r border-hairline bg-surface p-3 dark:border-white/10 dark:bg-surface-dark" aria-label="Navegación principal">
      {navSections.map((sec, i) => (
        <div key={i} className="mb-2">
          {sec.title && <p className="px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-slate/80">{sec.title}</p>}
          {sec.items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                `relative block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sello text-white shadow-soft before:absolute before:inset-y-1.5 before:-left-0.5 before:w-0.5 before:rounded-full before:bg-oro'
                    : 'text-ink/80 hover:bg-sello-tint hover:text-sello-ink dark:text-white/75 dark:hover:bg-white/5 dark:hover:text-white'
                }`
              }
            >
              {it.label}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  )
}
