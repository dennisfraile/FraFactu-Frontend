import { api } from '@/lib/http/axios'
import type {
  DashboardKPIs, VentasPorDia, ProductoMasVendido, VentasPorCategoria,
  VentasPorVendedor, ComparativoSucursal, DashboardCajero, PagedResult,
  VentaCategoriaDetalle, VentaVendedorDetalle, RangoParams,
} from './types'

interface Pagina { page?: number; pageSize?: number; search?: string }

export const dashboardApi = {
  async kpis(p: RangoParams & { fechaAnteriorInicio?: string; fechaAnteriorFin?: string }): Promise<DashboardKPIs> {
    const { data } = await api.get<DashboardKPIs>('/dashboard/kpis', { params: p })
    return data
  },
  async ventasPorDia(p: { dias?: number; sucursalId?: number }): Promise<VentasPorDia[]> {
    const { data } = await api.get<VentasPorDia[]>('/dashboard/ventas-por-dia', { params: p })
    return data
  },
  async topProductos(p: RangoParams & { top?: number }): Promise<ProductoMasVendido[]> {
    const { data } = await api.get<ProductoMasVendido[]>('/dashboard/productos-mas-vendidos', { params: p })
    return data
  },
  async ventasPorCategoria(p: RangoParams): Promise<VentasPorCategoria[]> {
    const { data } = await api.get<VentasPorCategoria[]>('/dashboard/ventas-por-categoria', { params: p })
    return data
  },
  async categoriaDetalle(p: RangoParams & Pagina & { categoriaId?: number }): Promise<PagedResult<VentaCategoriaDetalle>> {
    const { data } = await api.get<PagedResult<VentaCategoriaDetalle>>('/dashboard/ventas-por-categoria/detalle', { params: p })
    return data
  },
  async ventasPorVendedor(p: RangoParams): Promise<VentasPorVendedor[]> {
    const { data } = await api.get<VentasPorVendedor[]>('/dashboard/ventas-por-vendedor', { params: p })
    return data
  },
  async vendedorDetalle(p: RangoParams & Pagina & { vendedorId?: number }): Promise<PagedResult<VentaVendedorDetalle>> {
    const { data } = await api.get<PagedResult<VentaVendedorDetalle>>('/dashboard/ventas-por-vendedor/detalle', { params: p })
    return data
  },
  async comparativoSucursales(p: RangoParams & Pagina): Promise<PagedResult<ComparativoSucursal>> {
    const { fechaInicio, fechaFin, sucursalId, page, pageSize, search } = p
    const params = { desde: fechaInicio, hasta: fechaFin, sucursalId, page, pageSize, search }
    const { data } = await api.get<PagedResult<ComparativoSucursal>>('/dashboard/comparativo-sucursales', { params })
    return data
  },
  async cajero(p: RangoParams): Promise<DashboardCajero> {
    const params = { fechaDesde: p.fechaInicio, fechaHasta: p.fechaFin }
    const { data } = await api.get<DashboardCajero>('/dashboard/cajero', { params })
    return data
  },
}
