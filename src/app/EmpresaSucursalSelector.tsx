import { useAuthStore } from './auth-store'
export function EmpresaSucursalSelector() {
  const user = useAuthStore((s) => s.user)
  return (
    <button className="rounded-md border border-hairline px-3 py-1 text-xs" type="button">
      {user?.emisorNombre ?? 'Sin empresa'} ▾
    </button>
  )
}
