// src/features/dtes-recibidos/hooks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dtesRecibidosApi } from './api'
import { gmailApi, emisorPerfilApi } from './gmail-api'
import type { ListarDtesParams, EncolarLecturaRequest, ConfiguracionLecturaDto, MapearDteCompraDto } from './types'

export function useDtesRecibidos(params: ListarDtesParams) {
  return useQuery({ queryKey: ['dtes-recibidos', params], queryFn: () => dtesRecibidosApi.listar(params) })
}

export function useDteRecibido(id: number) {
  return useQuery({ queryKey: ['dte-recibido', id], queryFn: () => dtesRecibidosApi.getById(id), enabled: Number.isFinite(id) })
}

export function useEstadisticasDtes(params: ListarDtesParams) {
  return useQuery({ queryKey: ['dtes-estadisticas', params], queryFn: () => dtesRecibidosApi.estadisticas(params) })
}

function invalidarListados(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['dtes-recibidos'] })
  qc.invalidateQueries({ queryKey: ['dtes-estadisticas'] })
}

export function useCargarJson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (archivos: File[]) => dtesRecibidosApi.cargarJson(archivos),
    onSuccess: () => invalidarListados(qc),
  })
}

export function useDescartarDte() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) => dtesRecibidosApi.descartar(id, motivo),
    onSuccess: (_d, vars) => { invalidarListados(qc); qc.invalidateQueries({ queryKey: ['dte-recibido', vars.id] }) },
  })
}

export function useMapearYCrearCompra() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: MapearDteCompraDto }) => dtesRecibidosApi.mapearYCrearCompra(id, dto),
    onSuccess: (_d, vars) => { invalidarListados(qc); qc.invalidateQueries({ queryKey: ['dte-recibido', vars.id] }); qc.invalidateQueries({ queryKey: ['compras'] }) },
  })
}

export function useLeerCorreo() {
  return useMutation({ mutationFn: (dto: EncolarLecturaRequest) => dtesRecibidosApi.leerCorreo(dto) })
}

// Polling: refetch cada 2s mientras el job no esté terminado. Sin useEffect+setState.
export function useEstadoLecturaCorreo(activo: boolean) {
  return useQuery({
    queryKey: ['lectura-correo-estado'],
    queryFn: () => dtesRecibidosApi.estadoLectura(),
    enabled: activo,
    refetchInterval: (q) => (q.state.data?.terminado ? false : 2000),
  })
}

export function useConfigurarLectura() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: ConfiguracionLecturaDto) => dtesRecibidosApi.configurar(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mi-perfil'] }),
  })
}

export function useProbarConexion() {
  return useMutation({ mutationFn: () => dtesRecibidosApi.probarConexion() })
}

export function useMiPerfil() {
  return useQuery({ queryKey: ['mi-perfil'], queryFn: () => emisorPerfilApi.miPerfil() })
}

export function useGmailConnect() {
  return useMutation({ mutationFn: () => gmailApi.connect() })
}

export function useExchangeGmailCode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ code, state }: { code: string; state: string }) => gmailApi.exchangeCode(code, state),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mi-perfil'] }),
  })
}

export function useGmailDisconnect() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => gmailApi.disconnect(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mi-perfil'] }),
  })
}
