// src/features/compras/proveedores-api.ts
import { api } from '@/lib/http/axios'
import type {
  PagedResult, ProveedorDto, CrearProveedorDto, ActualizarProveedorDto, ListarProveedoresParams,
} from './types'

export const proveedoresApi = {
  async listar(params: ListarProveedoresParams): Promise<PagedResult<ProveedorDto>> {
    const { data } = await api.get<PagedResult<ProveedorDto>>('/proveedores', { params })
    return data
  },
  async getById(id: number): Promise<ProveedorDto> {
    const { data } = await api.get<ProveedorDto>(`/proveedores/${id}`)
    return data
  },
  // No hay endpoint de búsqueda dedicado; se usa el listar con filtro.
  async search(filtro: string): Promise<ProveedorDto[]> {
    const { data } = await api.get<PagedResult<ProveedorDto>>('/proveedores', {
      params: { filtro, soloActivos: true, pagina: 1, tamanoPagina: 20 },
    })
    return data.items
  },
  async crear(dto: CrearProveedorDto): Promise<ProveedorDto> {
    const { data } = await api.post<ProveedorDto>('/proveedores', dto)
    return data
  },
  async actualizar(id: number, dto: ActualizarProveedorDto): Promise<ProveedorDto> {
    const { data } = await api.put<ProveedorDto>(`/proveedores/${id}`, dto)
    return data
  },
  async cambiarEstado(id: number, activo: boolean): Promise<void> {
    await api.patch(`/proveedores/${id}/estado`, null, { params: { activo } })
  },
  async eliminar(id: number): Promise<void> {
    await api.delete(`/proveedores/${id}`)
  },
}
