import { ThemeToggle } from './ThemeToggle'
import { AmbienteBadge } from './AmbienteBadge'
import { UserMenu } from './UserMenu'
import { EmpresaSucursalSelector } from './EmpresaSucursalSelector'
export function Topbar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-hairline bg-surface/95 px-4 backdrop-blur-sm dark:border-white/10 dark:bg-surface-dark/95">
      <div className="flex items-center gap-2.5">
        {/* Marca = sello: cuadro verde con anillo de oro (lacre). */}
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-sello font-display text-[15px] font-bold text-white shadow-soft ring-1 ring-oro/40">F</span>
        <b className="font-display text-[15px] tracking-tight">FraFactu</b>
      </div>
      <div className="flex items-center gap-3">
        <EmpresaSucursalSelector />
        <AmbienteBadge />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  )
}
