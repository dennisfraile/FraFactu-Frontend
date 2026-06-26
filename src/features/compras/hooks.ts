// src/features/compras/hooks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { proveedoresApi } from './proveedores-api'
import { tiposGastoApi } from './catalogos-api'
import type { CrearProveedorDto, ActualizarProveedorDto, ListarProveedoresParams } from './types'

const HORA = 1000 * 60 * 60

export function useProveedores(params: ListarProveedoresParams) {
  return useQuery({ queryKey: ['proveedores', params], queryFn: () => proveedoresApi.listar(params) })
}

export function useProveedor(id: number) {
  return useQuery({ queryKey: ['proveedor', id], queryFn: () => proveedoresApi.getById(id), enabled: Number.isFinite(id) })
}

export function useCrearProveedor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CrearProveedorDto) => proveedoresApi.crear(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['proveedores'] }),
  })
}

export function useActualizarProveedor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: ActualizarProveedorDto }) => proveedoresApi.actualizar(id, dto),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['proveedores'] })
      qc.invalidateQueries({ queryKey: ['proveedor', vars.id] })
    },
  })
}

export function useCambiarEstadoProveedor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) => proveedoresApi.cambiarEstado(id, activo),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['proveedores'] }),
  })
}

export function useEliminarProveedor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => proveedoresApi.eliminar(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['proveedores'] }),
  })
}

export function useTiposGasto() {
  return useQuery({ queryKey: ['tipos-gasto'], queryFn: () => tiposGastoApi.listar(), staleTime: HORA })
}
