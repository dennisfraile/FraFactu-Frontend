import { Badge, Button, EmptyState } from '@/design-system'
import { Can } from '@/lib/authz/Can'
import type { UsuarioListDto } from '../types'

interface Props {
  usuarios: UsuarioListDto[]
  onEditar: (u: UsuarioListDto) => void
  onToggle: (u: UsuarioListDto) => void
  onEliminar: (u: UsuarioListDto) => void
}

const ROLES_ESCRITURA = ['SuperAdmin', 'EmisorAdmin', 'GerenteSucursal'] as const

export function UsuariosTable({ usuarios, onEditar, onToggle, onEliminar }: Props) {
  if (usuarios.length === 0) return <EmptyState title="Sin usuarios" hint="No hay usuarios que coincidan con el filtro." />

  return (
    <div className="overflow-x-auto rounded-lg border border-hairline dark:border-white/10">
      <table className="w-full text-sm">
        <thead className="bg-surface text-left text-xs uppercase tracking-wide text-slate dark:bg-surface-dark">
          <tr>
            <th className="px-3 py-2">Nombre</th>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">Rol</th>
            <th className="px-3 py-2">Sucursales</th>
            <th className="px-3 py-2">Estado</th>
            <th className="px-3 py-2 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id} className="border-t border-hairline dark:border-white/10">
              <td className="px-3 py-2 font-medium text-ink">{u.nombreCompleto}</td>
              <td className="px-3 py-2 text-slate">{u.email}</td>
              <td className="px-3 py-2">{u.rolNombre}</td>
              <td className="px-3 py-2 text-slate">{u.accesoTodasSucursales ? 'Todas' : (u.sucursalesNombres || `${u.cantidadSucursales}`)}</td>
              <td className="px-3 py-2">
                <Badge estado={u.activo ? 'recibido' : 'rechazado'}>{u.activo ? 'Activo' : 'Inactivo'}</Badge>
              </td>
              <td className="px-3 py-2">
                <Can roles={[...ROLES_ESCRITURA]}>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => onEditar(u)}>Editar</Button>
                    <Button variant="ghost" onClick={() => onToggle(u)}>{u.activo ? 'Desactivar' : 'Activar'}</Button>
                    <Button variant="ghost" onClick={() => onEliminar(u)}>Eliminar</Button>
                  </div>
                </Can>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
