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

import { comprasApi } from './api'
import type {
  CrearCompraExternaDto, ActualizarCompraExternaDto, ConfirmarCompraDto, AnularCompraDto, ListarComprasParams,
} from './types'

export function useCompras(params: ListarComprasParams) {
  return useQuery({ queryKey: ['compras', params], queryFn: () => comprasApi.listar(params) })
}

export function useCompra(id: number) {
  return useQuery({ queryKey: ['compra', id], queryFn: () => comprasApi.getById(id), enabled: Number.isFinite(id) })
}

export function useCrearCompra() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CrearCompraExternaDto) => comprasApi.crear(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compras'] }),
  })
}

export function useActualizarCompra() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: ActualizarCompraExternaDto }) => comprasApi.actualizar(id, dto),
    onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ['compras'] }); qc.invalidateQueries({ queryKey: ['compra', vars.id] }) },
  })
}

export function useEditarCompraConfirmada() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: ActualizarCompraExternaDto }) => comprasApi.editarConfirmada(id, dto),
    onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ['compras'] }); qc.invalidateQueries({ queryKey: ['compra', vars.id] }) },
  })
}

export function useConfirmarCompra() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: ConfirmarCompraDto }) => comprasApi.confirmar(id, dto),
    onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ['compras'] }); qc.invalidateQueries({ queryKey: ['compra', vars.id] }) },
  })
}

export function useAnularCompra() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: AnularCompraDto }) => comprasApi.anular(id, dto),
    onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ['compras'] }); qc.invalidateQueries({ queryKey: ['compra', vars.id] }) },
  })
}
