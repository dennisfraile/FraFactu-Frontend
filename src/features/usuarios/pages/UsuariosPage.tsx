// src/features/usuarios/pages/UsuariosPage.tsx
import { useState } from 'react'
import { Button, Input, Spinner, useToast } from '@/design-system'
import { Can } from '@/lib/authz/Can'
import { UsuariosTable } from '../components/UsuariosTable'
import { UsuarioFormModal } from '../components/UsuarioFormModal'
import {
  useUsuarios, useUsuario, useCrearUsuario, useActualizarUsuario, useToggleUsuario, useEliminarUsuario,
} from '../hooks'
import type { CrearUsuarioDto, ActualizarUsuarioDto, UsuarioListDto } from '../types'

const ROLES_ESCRITURA = ['SuperAdmin', 'EmisorAdmin', 'GerenteSucursal'] as const

export function UsuariosPage() {
  const toast = useToast()
  const [pageNumber, setPage] = useState(1)
  const [busqueda, setBusqueda] = useState('')
  const [soloActivos, setSoloActivos] = useState(false)
  const [modal, setModal] = useState<{ abierto: boolean; editId: number | null }>({ abierto: false, editId: null })

  const lista = useUsuarios({ pageNumber, pageSize: 10, searchTerm: busqueda || undefined, soloActivos: soloActivos || undefined })
  const detalle = useUsuario(modal.editId ?? 0)
  const crear = useCrearUsuario()
  const actualizar = useActualizarUsuario()
  const toggle = useToggleUsuario()
  const eliminar = useEliminarUsuario()

  const abrirNuevo = () => setModal({ abierto: true, editId: null })
  const abrirEditar = (u: UsuarioListDto) => setModal({ abierto: true, editId: u.id })
  const cerrar = () => setModal({ abierto: false, editId: null })

  const onCrear = (dto: CrearUsuarioDto) => {
    crear.mutate(dto, {
      onSuccess: () => { toast.show('Usuario creado', { tone: 'sello' }); cerrar() },
      onError: () => toast.show('No se pudo crear el usuario', { tone: 'rojo' }),
    })
  }
  const onEditar = (id: number, dto: ActualizarUsuarioDto) => {
    actualizar.mutate({ id, dto }, {
      onSuccess: () => { toast.show('Usuario actualizado', { tone: 'sello' }); cerrar() },
      onError: () => toast.show('No se pudo actualizar', { tone: 'rojo' }),
    })
  }
  const onToggle = (u: UsuarioListDto) => {
    toggle.mutate(u.id, {
      onSuccess: () => toast.show(u.activo ? 'Usuario desactivado' : 'Usuario activado', { tone: 'sello' }),
      onError: () => toast.show('No se pudo cambiar el estado', { tone: 'rojo' }),
    })
  }
  const onEliminar = (u: UsuarioListDto) => {
    if (!window.confirm(`¿Desactivar a ${u.nombreCompleto}?`)) return
    eliminar.mutate(u.id, {
      onSuccess: () => toast.show('Usuario desactivado', { tone: 'sello' }),
      onError: () => toast.show('No se pudo desactivar', { tone: 'rojo' }),
    })
  }

  const totalPages = lista.data?.totalPages ?? 1

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Usuarios</h1>
        <Can roles={[...ROLES_ESCRITURA]}>
          <Button onClick={abrirNuevo}>Nuevo usuario</Button>
        </Can>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input placeholder="Buscar por nombre o email…" value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPage(1) }} className="max-w-xs" />
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={soloActivos} onChange={(e) => { setSoloActivos(e.target.checked); setPage(1) }} />
          Solo activos
        </label>
      </div>

      {lista.isLoading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : lista.isError ? (
        <p className="rounded-md bg-rojo/10 px-3 py-2 text-sm text-rojo">No se pudieron cargar los usuarios.</p>
      ) : (
        <>
          <UsuariosTable usuarios={lista.data?.items ?? []} onEditar={abrirEditar} onToggle={onToggle} onEliminar={onEliminar} />
          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" disabled={pageNumber <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
              <span className="text-sm text-slate">Página {pageNumber} de {totalPages}</span>
              <Button variant="ghost" disabled={pageNumber >= totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
            </div>
          )}
        </>
      )}

      {modal.abierto && (modal.editId === null || detalle.isSuccess) && (
        <UsuarioFormModal
          inicial={modal.editId === null ? null : detalle.data}
          onGuardarCrear={onCrear}
          onGuardarEditar={onEditar}
          onClose={cerrar}
          cargando={crear.isPending || actualizar.isPending}
        />
      )}
    </div>
  )
}
