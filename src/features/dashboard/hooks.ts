import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from './api'
import type { RangoParams } from './types'

type Pagina = { page?: number; pageSize?: number; search?: string }

export function useKpis(p: RangoParams & { fechaAnteriorInicio?: string; fechaAnteriorFin?: string }) {
  return useQuery({ queryKey: ['dashboard-kpis', p], queryFn: () => dashboardApi.kpis(p) })
}
export function useVentasPorDia(p: { dias?: number; sucursalId?: number }) {
  return useQuery({ queryKey: ['dashboard-ventas-dia', p], queryFn: () => dashboardApi.ventasPorDia(p) })
}
export function useTopProductos(p: RangoParams & { top?: number }) {
  return useQuery({ queryKey: ['dashboard-top-productos', p], queryFn: () => dashboardApi.topProductos(p) })
}
export function useVentasPorCategoria(p: RangoParams) {
  return useQuery({ queryKey: ['dashboard-categoria', p], queryFn: () => dashboardApi.ventasPorCategoria(p) })
}
export function useCategoriaDetalle(p: RangoParams & Pagina & { categoriaId?: number }) {
  return useQuery({ queryKey: ['dashboard-categoria-detalle', p], queryFn: () => dashboardApi.categoriaDetalle(p) })
}
export function useVentasPorVendedor(p: RangoParams) {
  return useQuery({ queryKey: ['dashboard-vendedor', p], queryFn: () => dashboardApi.ventasPorVendedor(p) })
}
export function useVendedorDetalle(p: RangoParams & Pagina & { vendedorId?: number }) {
  return useQuery({ queryKey: ['dashboard-vendedor-detalle', p], queryFn: () => dashboardApi.vendedorDetalle(p) })
}
export function useComparativoSucursales(p: RangoParams & Pagina, enabled: boolean) {
  return useQuery({ queryKey: ['dashboard-comparativo', p], queryFn: () => dashboardApi.comparativoSucursales(p), enabled })
}
export function useDashboardCajero(p: RangoParams, enabled: boolean) {
  return useQuery({ queryKey: ['dashboard-cajero', p], queryFn: () => dashboardApi.cajero(p), enabled })
}
