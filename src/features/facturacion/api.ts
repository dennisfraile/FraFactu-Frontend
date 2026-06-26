// src/features/facturacion/api.ts
import { api } from '@/lib/http/axios'
import type {
  CreateFacturaDto, FacturaResponse, FacturaListItem, PaginatedResponse,
  AnularFacturaDto, PuedeInvalidarResult, BuscarParaNcResultDto, DetalleParaNcDto,
} from './types'

export interface ListarFacturasParams {
  pageNumber?: number
  pageSize?: number
  search?: string
  tipoDte?: string
  estadoHacienda?: string
  fechaDesde?: string
  fechaHasta?: string
  sucursalId?: number
  ambiente?: string
}

export const facturacionApi = {
  async crear(dto: CreateFacturaDto): Promise<FacturaResponse> {
    const { data } = await api.post<FacturaResponse>('/facturas', dto)
    return data
  },
  async guardarPendiente(dto: CreateFacturaDto): Promise<FacturaResponse> {
    const { data } = await api.post<FacturaResponse>('/facturas/guardar-pendiente', dto)
    return data
  },
  async getById(id: number): Promise<FacturaResponse> {
    const { data } = await api.get<FacturaResponse>(`/facturas/${id}`)
    return data
  },
  async getByCodigo(codigo: string): Promise<FacturaResponse> {
    const { data } = await api.get<FacturaResponse>(`/facturas/codigo/${codigo}`)
    return data
  },
  async listar(params: ListarFacturasParams): Promise<PaginatedResponse<FacturaListItem>> {
    const { data } = await api.get<PaginatedResponse<FacturaListItem>>('/facturas', { params })
    return data
  },
  async anular(id: number, dto: AnularFacturaDto): Promise<void> {
    await api.post(`/facturas/${id}/anular`, dto)
  },
  async puedeInvalidar(id: number): Promise<PuedeInvalidarResult> {
    const { data } = await api.get<PuedeInvalidarResult>(`/facturas/${id}/puede-invalidar`)
    return data
  },
  async getJsonDte(id: number): Promise<string> {
    const { data } = await api.get(`/facturas/${id}/json-dte`, { responseType: 'text' })
    return data as string
  },
  async buscarParaNc(search: string): Promise<BuscarParaNcResultDto[]> {
    const { data } = await api.get<BuscarParaNcResultDto[]>('/facturas/buscar-para-nc', { params: { search } })
    return data
  },
  async buscarParaNd(search: string): Promise<BuscarParaNcResultDto[]> {
    const { data } = await api.get<BuscarParaNcResultDto[]>('/facturas/buscar-para-nd', { params: { search } })
    return data
  },
  async detalleParaNc(id: number): Promise<DetalleParaNcDto> {
    const { data } = await api.get<DetalleParaNcDto>(`/facturas/${id}/detalle-para-nc`)
    return data
  },
  async detalleParaNd(id: number): Promise<DetalleParaNcDto> {
    const { data } = await api.get<DetalleParaNcDto>(`/facturas/${id}/detalle-para-nd`)
    return data
  },
}
