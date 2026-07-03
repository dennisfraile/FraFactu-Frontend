import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productosApi, categoriasApi, marcasApi, inventarioApi, reportesApi, type ListarProductosParams, type ListarStockParams, type ListarMovimientosParams } from './api'
import type { CrearProductoDto, ActualizarProductoDto, DesactivarProductoDto, CrearCategoriaDto, CrearMarcaDto, AjusteInventarioDto, TrasladoInventarioDto } from './types'
import { HORA } from '@/lib/query/queryClient'

export function useProductos(params: ListarProductosParams) {
  return useQuery({ queryKey: ['inv-productos', params], queryFn: () => productosApi.listar(params) })
}
export function useProducto(id: number) {
  return useQuery({ queryKey: ['inv-producto', id], queryFn: () => productosApi.getById(id), enabled: Number.isFinite(id) })
}
export function useCrearProducto() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (dto: CrearProductoDto) => productosApi.crear(dto), onSuccess: () => qc.invalidateQueries({ queryKey: ['inv-productos'] }) })
}
export function useActualizarProducto() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, dto }: { id: number; dto: ActualizarProductoDto }) => productosApi.actualizar(id, dto), onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ['inv-productos'] }); qc.invalidateQueries({ queryKey: ['inv-producto', v.id] }) } })
}
export function useToggleProducto() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: number) => productosApi.toggleActivo(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['inv-productos'] }) })
}
export function useDesactivarProducto() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, dto }: { id: number; dto: DesactivarProductoDto }) => productosApi.desactivar(id, dto), onSuccess: () => qc.invalidateQueries({ queryKey: ['inv-productos'] }) })
}

export function useCategorias() { return useQuery({ queryKey: ['inv-categorias'], queryFn: () => categoriasApi.listar(), staleTime: HORA }) }
export function useCrearCategoria() { const qc = useQueryClient(); return useMutation({ mutationFn: (dto: CrearCategoriaDto) => categoriasApi.crear(dto), onSuccess: () => qc.invalidateQueries({ queryKey: ['inv-categorias'] }) }) }
export function useActualizarCategoria() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, dto }: { id: number; dto: CrearCategoriaDto }) => categoriasApi.actualizar(id, dto), onSuccess: () => qc.invalidateQueries({ queryKey: ['inv-categorias'] }) }) }
export function useToggleCategoria() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: number) => categoriasApi.toggleActivo(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['inv-categorias'] }) }) }
export function useEliminarCategoria() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: number) => categoriasApi.eliminar(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['inv-categorias'] }) }) }

export function useMarcas() { return useQuery({ queryKey: ['inv-marcas'], queryFn: () => marcasApi.listar(), staleTime: HORA }) }
export function useCrearMarca() { const qc = useQueryClient(); return useMutation({ mutationFn: (dto: CrearMarcaDto) => marcasApi.crear(dto), onSuccess: () => qc.invalidateQueries({ queryKey: ['inv-marcas'] }) }) }
export function useActualizarMarca() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, dto }: { id: number; dto: CrearMarcaDto }) => marcasApi.actualizar(id, dto), onSuccess: () => qc.invalidateQueries({ queryKey: ['inv-marcas'] }) }) }
export function useToggleMarca() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: number) => marcasApi.toggleActivo(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['inv-marcas'] }) }) }
export function useEliminarMarca() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: number) => marcasApi.eliminar(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['inv-marcas'] }) }) }

// Un ajuste/traslado cambia el stock, por lo que invalida no solo existencias y
// movimientos sino también los reportes derivados (bajo mínimo, valoración, KPIs,
// kardex). invalidateQueries hace match por prefijo, así cubre las keys con params.
const KEYS_AFECTADAS_POR_MOVIMIENTO = ['inv-stock', 'inv-movimientos', 'inv-bajo-minimo', 'inv-valoracion', 'inv-kpis', 'inv-kardex']
function invalidarPorMovimiento(qc: ReturnType<typeof useQueryClient>) { KEYS_AFECTADAS_POR_MOVIMIENTO.forEach((k) => qc.invalidateQueries({ queryKey: [k] })) }

export function useAjustarStock() { const qc = useQueryClient(); return useMutation({ mutationFn: (dto: AjusteInventarioDto) => inventarioApi.ajustar(dto), onSuccess: () => invalidarPorMovimiento(qc) }) }
export function useTrasladarStock() { const qc = useQueryClient(); return useMutation({ mutationFn: (dto: TrasladoInventarioDto) => inventarioApi.trasladar(dto), onSuccess: () => invalidarPorMovimiento(qc) }) }

export function useStock(params: ListarStockParams) { return useQuery({ queryKey: ['inv-stock', params], queryFn: () => reportesApi.stock(params) }) }
export function useBajoMinimo(sucursalId?: number) { return useQuery({ queryKey: ['inv-bajo-minimo', sucursalId], queryFn: () => reportesApi.bajoMinimo(sucursalId) }) }
export function useSinMovimiento(sucursalId?: number) { return useQuery({ queryKey: ['inv-sin-movimiento', sucursalId], queryFn: () => reportesApi.sinMovimiento(sucursalId) }) }
export function useMovimientos(params: ListarMovimientosParams) { return useQuery({ queryKey: ['inv-movimientos', params], queryFn: () => reportesApi.movimientos(params) }) }
export function useKardex(productoId: number, params: { bodegaId?: number; desde?: string; hasta?: string; page?: number; pageSize?: number }) { return useQuery({ queryKey: ['inv-kardex', productoId, params], queryFn: () => reportesApi.kardex(productoId, params), enabled: Number.isFinite(productoId) && productoId > 0 }) }
export function useValoracion(bodegaId?: number) { return useQuery({ queryKey: ['inv-valoracion', bodegaId], queryFn: () => reportesApi.valoracion(bodegaId) }) }
export function useRotacion() { return useQuery({ queryKey: ['inv-rotacion'], queryFn: () => reportesApi.rotacion() }) }
export function useRotacionAbc() { return useQuery({ queryKey: ['inv-rotacion-abc'], queryFn: () => reportesApi.rotacionAbc() }) }
export function useKpis() { return useQuery({ queryKey: ['inv-kpis'], queryFn: () => reportesApi.kpis() }) }
