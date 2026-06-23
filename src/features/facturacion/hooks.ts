// src/features/facturacion/hooks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { facturacionApi, type ListarFacturasParams } from './api'
import { catalogosApi, vendedoresApi, sucursalesApi, type NombreCatalogo } from './catalogos-api'
import type { CreateFacturaDto, AnularFacturaDto } from './types'

const HORA_CATALOGO = 1000 * 60 * 60 // catálogos: estáticos durante la sesión

export function useCatalogo(nombre: NombreCatalogo) {
  return useQuery({
    queryKey: ['catalogo', nombre],
    queryFn: () => catalogosApi.get(nombre),
    staleTime: HORA_CATALOGO,
  })
}

export function useMunicipios() {
  return useQuery({ queryKey: ['catalogo', 'municipios'], queryFn: () => catalogosApi.municipios(), staleTime: HORA_CATALOGO })
}

export function useDistritos() {
  return useQuery({ queryKey: ['catalogo', 'distritos'], queryFn: () => catalogosApi.distritos(), staleTime: HORA_CATALOGO })
}

export function useVendedores(sucursalId?: number) {
  return useQuery({ queryKey: ['vendedores', sucursalId], queryFn: () => vendedoresApi.listar(sucursalId) })
}

export function useSucursales() {
  return useQuery({ queryKey: ['sucursales'], queryFn: () => sucursalesApi.todasActivas(), staleTime: HORA_CATALOGO })
}

export function useHistorial(params: ListarFacturasParams) {
  return useQuery({
    queryKey: ['facturas', params],
    queryFn: () => facturacionApi.listar(params),
  })
}

export function useFactura(id: number) {
  return useQuery({ queryKey: ['factura', id], queryFn: () => facturacionApi.getById(id), enabled: Number.isFinite(id) })
}

export function useEmitirFactura() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateFacturaDto) => facturacionApi.crear(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['facturas'] }),
  })
}

export function useAnularFactura() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: AnularFacturaDto }) => facturacionApi.anular(id, dto),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['facturas'] })
      qc.invalidateQueries({ queryKey: ['factura', vars.id] })
    },
  })
}

// Provisto para F5.4 (flujo de invalidación real, requiere credenciales MH).
export function usePuedeInvalidar(id: number, enabled: boolean) {
  return useQuery({
    queryKey: ['puede-invalidar', id],
    queryFn: () => facturacionApi.puedeInvalidar(id),
    enabled,
  })
}
