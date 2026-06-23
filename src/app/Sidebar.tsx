import { NavLink } from 'react-router-dom'
import { navSections } from './nav-config'
export function Sidebar() {
  return (
    <nav className="flex w-56 flex-col gap-1 border-r border-hairline bg-surface p-3 dark:bg-[#16241f]" aria-label="Navegación principal">
      {navSections.map((sec, i) => (
        <div key={i} className="mb-2">
          {sec.title && <p className="px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-slate">{sec.title}</p>}
          {sec.items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm ${isActive ? 'bg-sello text-white' : 'text-ink hover:bg-sello/10 dark:text-[#fafaf8]'}`
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
