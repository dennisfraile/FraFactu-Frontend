// src/features/dtes-recibidos/api.ts
import { api } from '@/lib/http/axios'
import type {
  PagedDtes, DteRecibidoResumenDto, DteRecibidoDto, ListarDtesParams, DteEstadisticasDto,
  CargaMasivaResponse, EncolarLecturaRequest, EncolarLecturaResponse, EstadoLecturaJob,
  ConfiguracionLecturaDto, MapearDteCompraDto, MapearDteCompraResponse,
} from './types'

export const dtesRecibidosApi = {
  async listar(params: ListarDtesParams): Promise<PagedDtes<DteRecibidoResumenDto>> {
    const { data } = await api.get<PagedDtes<DteRecibidoResumenDto>>('/dtesrecibidos', { params })
    return data
  },
  async getById(id: number): Promise<DteRecibidoDto> {
    const { data } = await api.get<DteRecibidoDto>(`/dtesrecibidos/${id}`)
    return data
  },
  async estadisticas(params: ListarDtesParams): Promise<DteEstadisticasDto> {
    const { data } = await api.get<DteEstadisticasDto>('/dtesrecibidos/estadisticas', { params })
    return data
  },
  async cargarJson(archivos: File[]): Promise<CargaMasivaResponse> {
    const fd = new FormData()
    archivos.forEach((f) => fd.append('archivos', f))
    // Usar el adaptador 'http' (Node.js http.request) para evitar incompatibilidades
    // entre el FormData de jsdom y el interceptor XHR de MSW en tests.
    // En producción (navegador) la cadena 'http' no existe y axios cae en XHR automáticamente.
    const { data } = await api.post<CargaMasivaResponse>('/dtesrecibidos/cargar-json', fd, {
      adapter: ['http', 'xhr', 'fetch'],
    })
    return data
  },
  async descartar(id: number, motivo: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>(`/dtesrecibidos/${id}/descartar`, { motivo })
    return data
  },
  async mapearYCrearCompra(id: number, dto: MapearDteCompraDto): Promise<MapearDteCompraResponse> {
    const { data } = await api.post<MapearDteCompraResponse>(`/dtesrecibidos/${id}/mapear-y-crear-compra`, dto)
    return data
  },
  async leerCorreo(dto: EncolarLecturaRequest): Promise<EncolarLecturaResponse> {
    const { data } = await api.post<EncolarLecturaResponse>('/dtesrecibidos/leer-correo', dto)
    return data
  },
  async estadoLectura(): Promise<EstadoLecturaJob> {
    const { data } = await api.get<EstadoLecturaJob>('/dtesrecibidos/leer-correo/estado')
    return data
  },
  async configurar(dto: ConfiguracionLecturaDto): Promise<{ message: string }> {
    const { data } = await api.put<{ message: string }>('/dtesrecibidos/configuracion', dto)
    return data
  },
  async probarConexion(): Promise<{ exitoso: boolean; mensaje: string }> {
    const { data } = await api.post<{ exitoso: boolean; mensaje: string }>('/dtesrecibidos/probar-conexion', {})
    return data
  },
}
