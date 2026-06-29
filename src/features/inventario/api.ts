import { api } from '@/lib/http/axios'
import type {
  ProductoListItem, ProductoDetalle, CrearProductoDto, ActualizarProductoDto,
  DesactivarProductoDto, Categoria, CrearCategoriaDto, Marca, CrearMarcaDto, AjusteInventarioDto,
  TrasladoInventarioDto, PagedResult, StockPorBodega, ProductoBajoMinimo, ProductoSinMovimiento,
  MovimientoInventario, KardexProducto, ValoracionInventario, RotacionProducto, RotacionAbcItem, InventarioKPIs,
} from './types'

// PaginatedResponse de productos (estilo F2)
export interface PaginatedResponse<T> { items: T[]; totalCount: number; pageNumber: number; pageSize: number; totalPages: number }

export interface ListarProductosParams {
  pageNumber: number
  pageSize: number
  searchTerm?: string
  sucursalId?: number
  categoriaId?: number
  marcaId?: number
  tipo?: string
  incluirInactivos?: boolean
}

export const productosApi = {
  async listar(params: ListarProductosParams): Promise<PaginatedResponse<ProductoListItem>> {
    const { data } = await api.get<PaginatedResponse<ProductoListItem>>('/productosservicios', { params })
    return data
  },
  async getById(id: number): Promise<ProductoDetalle> {
    const { data } = await api.get<ProductoDetalle>(`/productosservicios/${id}`)
    return data
  },
  async crear(dto: CrearProductoDto): Promise<ProductoDetalle> {
    const { data } = await api.post<ProductoDetalle>('/productosservicios', dto)
    return data
  },
  async actualizar(id: number, dto: ActualizarProductoDto): Promise<ProductoDetalle> {
    const { data } = await api.put<ProductoDetalle>(`/productosservicios/${id}`, dto)
    return data
  },
  async toggleActivo(id: number): Promise<void> { await api.patch(`/productosservicios/${id}/toggle-active`) },
  async desactivar(id: number, dto: DesactivarProductoDto): Promise<void> { await api.post(`/productosservicios/${id}/desactivar`, dto) },
}

export const categoriasApi = {
  async listar(): Promise<Categoria[]> { const { data } = await api.get<Categoria[]>('/categorias'); return data },
  async crear(dto: CrearCategoriaDto): Promise<Categoria> { const { data } = await api.post<Categoria>('/categorias', dto); return data },
  async actualizar(id: number, dto: CrearCategoriaDto): Promise<Categoria> { const { data } = await api.put<Categoria>(`/categorias/${id}`, dto); return data },
  async toggleActivo(id: number): Promise<void> { await api.patch(`/categorias/${id}/toggle-active`) },
  async eliminar(id: number): Promise<void> { await api.delete(`/categorias/${id}`) },
}

export const marcasApi = {
  async listar(): Promise<Marca[]> { const { data } = await api.get<Marca[]>('/marcas'); return data },
  async crear(dto: CrearMarcaDto): Promise<Marca> { const { data } = await api.post<Marca>('/marcas', dto); return data },
  async actualizar(id: number, dto: CrearMarcaDto): Promise<Marca> { const { data } = await api.put<Marca>(`/marcas/${id}`, dto); return data },
  async toggleActivo(id: number): Promise<void> { await api.patch(`/marcas/${id}/toggle-active`) },
  async eliminar(id: number): Promise<void> { await api.delete(`/marcas/${id}`) },
}

export const inventarioApi = {
  async ajustar(dto: AjusteInventarioDto): Promise<unknown> { const { data } = await api.post('/inventario/ajustes', dto); return data ?? true },
  async trasladar(dto: TrasladoInventarioDto): Promise<unknown> { const { data } = await api.post('/inventario/traslado', dto); return data ?? true },
}

export interface ListarStockParams { bodegaId?: number; productoId?: number; search?: string; page?: number; pageSize?: number; sucursalId?: number; categoriaId?: number; marcaId?: number }
export interface ListarMovimientosParams { desde: string; hasta: string; productoId?: number; bodegaId?: number; tipoMovimiento?: string; search?: string; page?: number; pageSize?: number; sucursalId?: number; ocultarAnulaciones?: boolean }

export const reportesApi = {
  async stock(params: ListarStockParams): Promise<PagedResult<StockPorBodega>> { const { data } = await api.get<PagedResult<StockPorBodega>>('/inventarioreportes/stock', { params }); return data },
  async bajoMinimo(sucursalId?: number): Promise<ProductoBajoMinimo[]> { const { data } = await api.get<ProductoBajoMinimo[]>('/inventarioreportes/stock/bajo-minimo', { params: { sucursalId } }); return data },
  async sinMovimiento(sucursalId?: number): Promise<ProductoSinMovimiento[]> { const { data } = await api.get<ProductoSinMovimiento[]>('/inventarioreportes/stock/sin-movimiento', { params: { sucursalId } }); return data },
  async movimientos(params: ListarMovimientosParams): Promise<PagedResult<MovimientoInventario>> { const { data } = await api.get<PagedResult<MovimientoInventario>>('/inventarioreportes/movimientos', { params }); return data },
  async kardex(productoId: number, params: { bodegaId?: number; desde?: string; hasta?: string; page?: number; pageSize?: number; sucursalId?: number }): Promise<KardexProducto> { const { data } = await api.get<KardexProducto>(`/inventarioreportes/kardex/${productoId}`, { params }); return data },
  async valoracion(bodegaId?: number, sucursalId?: number): Promise<ValoracionInventario> { const { data } = await api.get<ValoracionInventario>('/inventarioreportes/valoracion', { params: { bodegaId, sucursalId } }); return data },
  async rotacion(sucursalId?: number): Promise<RotacionProducto[]> { const { data } = await api.get<RotacionProducto[]>('/inventarioreportes/rotacion', { params: { sucursalId } }); return data },
  async rotacionAbc(sucursalId?: number): Promise<RotacionAbcItem[]> { const { data } = await api.get<RotacionAbcItem[]>('/inventarioreportes/rotacion-abc', { params: { sucursalId } }); return data },
  async kpis(sucursalId?: number): Promise<InventarioKPIs> { const { data } = await api.get<InventarioKPIs>('/inventarioreportes/kpis', { params: { sucursalId } }); return data },
}
