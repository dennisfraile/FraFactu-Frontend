import { NavLink } from 'react-router-dom'
import { Icon } from '@/design-system'
import { navSections } from './nav-config'
import { useAuthz } from '@/lib/authz/useAuthz'
import { puede } from '@/lib/authz/roles'

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { rol } = useAuthz()
  const secciones = navSections
    .map((sec) => ({ ...sec, items: sec.items.filter((it) => !it.roles || puede(rol, it.roles)) }))
    .filter((sec) => sec.items.length > 0)
  return (
    <nav
      className={`flex shrink-0 flex-col border-r border-hairline bg-surface p-3 transition-[width] duration-300 ease-in-out dark:border-white/10 dark:bg-surface-dark ${collapsed ? 'w-16' : 'w-56'}`}
      aria-label="Navegación principal"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        className="mb-2 flex h-9 items-center justify-center rounded-md text-slate transition-colors hover:bg-sello-tint hover:text-sello-ink dark:hover:bg-white/5 dark:hover:text-white"
      >
        <Icon name="menu" size={20} />
      </button>

      {secciones.map((sec, i) => (
        <div key={i} className="mb-2">
          {sec.title &&
            (collapsed ? (
              <div className="mx-2 my-1 h-px bg-hairline dark:bg-white/10" />
            ) : (
              <p className="px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-slate/80">{sec.title}</p>
            ))}
          {sec.items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              title={collapsed ? it.label : undefined}
              className={({ isActive }) =>
                `group relative flex items-center rounded-md text-sm font-medium transition-colors ${
                  collapsed ? 'h-10 justify-center' : 'gap-3 px-3 py-2'
                } ${
                  isActive
                    ? 'bg-sello text-white shadow-soft before:absolute before:inset-y-1.5 before:-left-0.5 before:w-0.5 before:rounded-full before:bg-oro'
                    : 'text-ink/80 hover:bg-sello-tint hover:text-sello-ink dark:text-white/75 dark:hover:bg-white/5 dark:hover:text-white'
                }`
              }
            >
              <Icon name={it.icon} size={18} className="shrink-0 transition-transform duration-200 group-hover:scale-110" />
              {!collapsed && <span className="truncate">{it.label}</span>}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  )
}
