import { api } from '@/lib/http/axios'
import type {
  PaginatedResponse, UsuarioListDto, UsuarioDto, CrearUsuarioDto, ActualizarUsuarioDto,
  ListarUsuariosParams, Rol, CajaUsuario,
} from './types'

export const usuariosApi = {
  async listar(params: ListarUsuariosParams): Promise<PaginatedResponse<UsuarioListDto>> {
    const { data } = await api.get<PaginatedResponse<UsuarioListDto>>('/usuarios', { params })
    return data
  },
  async getById(id: number): Promise<UsuarioDto> {
    const { data } = await api.get<UsuarioDto>(`/usuarios/${id}`)
    return data
  },
  async crear(dto: CrearUsuarioDto): Promise<UsuarioDto> {
    const { data } = await api.post<UsuarioDto>('/usuarios', dto)
    return data
  },
  async actualizar(id: number, dto: ActualizarUsuarioDto): Promise<UsuarioDto> {
    const { data } = await api.put<UsuarioDto>(`/usuarios/${id}`, dto)
    return data
  },
  async toggleActive(id: number): Promise<void> { await api.patch(`/usuarios/${id}/toggle-active`) },
  async eliminar(id: number): Promise<void> { await api.delete(`/usuarios/${id}`) },
}

export const rolesApi = {
  async listar(): Promise<Rol[]> { const { data } = await api.get<Rol[]>('/roles'); return data },
}

export const cajasApi = {
  async listarTodas(): Promise<CajaUsuario[]> {
    const { data } = await api.get<CajaUsuario[]>('/cajas', { params: { soloActivos: true } })
    return data
  },
}
