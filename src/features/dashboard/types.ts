export interface PagedResult<T> {
  items: T[]
  totalItems: number
  pageNumber: number
  pageSize: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface RangoParams { fechaInicio?: string; fechaFin?: string; sucursalId?: number }

export interface DashboardKPIs {
  totalFacturas: number
  totalVentas: number
  promedioVenta: number
  facturasAprobadas: number
  facturasPendientes: number
  facturasRechazadas: number
  crecimientoVentas: number
}

export interface VentasPorDia { fecha: string; cantidadFacturas: number; totalVentas: number }

export interface ProductoMasVendido { productoId: number; nombreProducto: string; cantidadVendida: number; totalVentas: number }

export interface VentasPorCategoria { categoriaId: number; nombreCategoria: string; totalVentas: number; cantidadVendidaReales: number; cantidadProductos: number }

export interface VentaCategoriaDetalle {
  facturaDetalleId: number; facturaId: number; numeroControl: string; codigoGeneracion: string
  fechaEmision: string; productoId: number | null; productoNombre: string
  categoriaId: number | null; categoriaNombre: string | null; cantidad: number; totalVenta: number
  receptorNombre: string; sucursalId: number | null; sucursalNombre: string | null
}

export interface VentasPorVendedor { vendedorId: number; codigoVendedor: string; nombreVendedor: string; totalVentas: number; cantidadFacturas: number; promedioVenta: number }

export interface VentaVendedorDetalle {
  facturaId: number; numeroControl: string; codigoGeneracion: string; fechaEmision: string
  receptorNombre: string; totalPagar: number; estadoHacienda: string
  vendedorId: number | null; vendedorCodigo: string | null; vendedorNombre: string | null
  sucursalId: number | null; sucursalNombre: string | null
}

export interface ComparativoSucursal { sucursalId: number; codigoSucursal: string; nombreSucursal: string; totalFacturas: number; totalVentas: number; promedioVenta: number; porcentajeDelTotal: number }

export interface VentaDiaCajero { fecha: string; cantidadFacturas: number; montoTotal: number }
export interface DashboardCajero { totalFacturas: number; montoTotalVendido: number; promedioVenta: number; ventasPorDia: VentaDiaCajero[] }
