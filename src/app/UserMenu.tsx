import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from './auth-store'
import { authApi } from '@/features/auth/api'

export function UserMenu() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  async function cerrarSesion() {
    try { await authApi.logout() } catch { /* la sesión se limpia igual */ }
    logout()
    navigate('/login', { replace: true })
  }
  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-sello/10"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-sello/20 text-xs">{user?.nombreCompleto?.[0] ?? '?'}</span>
        {user?.nombreCompleto ?? 'Usuario'}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-1 w-44 rounded-md border border-hairline bg-surface p-1 shadow-lg dark:bg-[#16241f]">
          <button role="menuitem" onClick={cerrarSesion} className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-rojo/10 text-rojo">
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
