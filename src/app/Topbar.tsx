import { ThemeToggle } from './ThemeToggle'
import { AmbienteBadge } from './AmbienteBadge'
import { UserMenu } from './UserMenu'
import { EmpresaSucursalSelector } from './EmpresaSucursalSelector'
export function Topbar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-hairline bg-surface px-4 dark:bg-[#16241f]">
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-sello font-display font-bold text-white">F</span>
        <b className="font-display tracking-tight">FraFactu</b>
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
