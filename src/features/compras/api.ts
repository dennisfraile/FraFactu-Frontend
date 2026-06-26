// src/features/compras/api.ts
import { api } from '@/lib/http/axios'
import type {
  PagedResult, CompraExternaDto, CrearCompraExternaDto, ActualizarCompraExternaDto,
  ConfirmarCompraDto, AnularCompraDto, ListarComprasParams,
} from './types'

export const comprasApi = {
  async listar(params: ListarComprasParams): Promise<PagedResult<CompraExternaDto>> {
    const { data } = await api.get<PagedResult<CompraExternaDto>>('/comprasexternas', { params })
    return data
  },
  async getById(id: number): Promise<CompraExternaDto> {
    const { data } = await api.get<CompraExternaDto>(`/comprasexternas/${id}`)
    return data
  },
  async crear(dto: CrearCompraExternaDto): Promise<CompraExternaDto> {
    const { data } = await api.post<CompraExternaDto>('/comprasexternas', dto)
    return data
  },
  async actualizar(id: number, dto: ActualizarCompraExternaDto): Promise<CompraExternaDto> {
    const { data } = await api.put<CompraExternaDto>(`/comprasexternas/${id}`, dto)
    return data
  },
  async editarConfirmada(id: number, dto: ActualizarCompraExternaDto): Promise<CompraExternaDto> {
    const { data } = await api.put<CompraExternaDto>(`/comprasexternas/${id}/editar-confirmada`, dto)
    return data
  },
  async confirmar(id: number, dto: ConfirmarCompraDto): Promise<CompraExternaDto> {
    const { data } = await api.post<CompraExternaDto>(`/comprasexternas/${id}/confirmar`, dto)
    return data
  },
  async anular(id: number, dto: AnularCompraDto): Promise<CompraExternaDto> {
    const { data } = await api.post<CompraExternaDto>(`/comprasexternas/${id}/anular`, dto)
    return data
  },
}
