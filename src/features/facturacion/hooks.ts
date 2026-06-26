// src/features/facturacion/hooks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { facturacionApi, type ListarFacturasParams } from './api'
import { catalogosApi, vendedoresApi, sucursalesApi, cajasApi, bodegasApi, receptoresApi, type NombreCatalogo } from './catalogos-api'
import type { CreateFacturaDto, AnularFacturaDto, CrearReceptorDto } from './types'

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

export function useCajas(sucursalId?: number) {
  return useQuery({
    queryKey: ['cajas', sucursalId],
    queryFn: () => cajasApi.porSucursal(sucursalId!),
    enabled: Number.isFinite(sucursalId),
  })
}

export function useBodegas(sucursalId?: number) {
  return useQuery({
    queryKey: ['bodegas', sucursalId],
    queryFn: () => bodegasApi.porSucursal(sucursalId!),
    enabled: Number.isFinite(sucursalId),
  })
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
    // F5.1: emisión en modo PENDIENTE (sin transmisión a MH) vía guardar-pendiente.
    // POST /facturas transmite a MH y requiere credenciales reales (se difiere a F5.4).
    mutationFn: (dto: CreateFacturaDto) => facturacionApi.guardarPendiente(dto),
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

export function useActividadesEconomicas() {
  return useQuery({ queryKey: ['catalogo', 'actividades-economicas'], queryFn: () => catalogosApi.actividadesEconomicas(), staleTime: HORA_CATALOGO })
}

export function useTiposDocumentoReceptor() {
  return useCatalogo('tiposDocIdentificacion')
}

export function useDepartamentos() {
  return useCatalogo('departamentos')
}

export function useCrearReceptor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CrearReceptorDto) => receptoresApi.crear(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['receptores'] }),
  })
}

export function useDetalleParaNc(id: number | null, enabled: boolean) {
  return useQuery({ queryKey: ['detalle-para-nc', id], queryFn: () => facturacionApi.detalleParaNc(id!), enabled: enabled && Number.isFinite(id) })
}

export function useDetalleParaNd(id: number | null, enabled: boolean) {
  return useQuery({ queryKey: ['detalle-para-nd', id], queryFn: () => facturacionApi.detalleParaNd(id!), enabled: enabled && Number.isFinite(id) })
}
