import { Link } from 'react-router-dom'
import { Icon } from '@/design-system'

export function AccesoDenegado() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <Icon name="usuarios" size={48} className="text-slate" />
      <h1 className="text-xl font-semibold text-ink">Acceso denegado</h1>
      <p className="max-w-md text-sm text-slate">
        Tu rol no tiene permiso para ver esta sección. Si crees que es un error, contacta a un administrador.
      </p>
      <Link to="/dashboard" className="text-sm font-medium text-sello underline">Volver al Dashboard</Link>
    </div>
  )
}
