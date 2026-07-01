import { http, HttpResponse } from 'msw'
import type {
  DashboardKPIs, VentasPorDia, ProductoMasVendido, VentasPorCategoria,
  VentasPorVendedor, ComparativoSucursal, DashboardCajero, PagedResult,
  VentaCategoriaDetalle, VentaVendedorDetalle,
} from '@/features/dashboard/types'

const base = 'http://localhost:8080/api'

export const kpisEjemplo: DashboardKPIs = { totalFacturas: 120, totalVentas: 45000, promedioVenta: 375, facturasAprobadas: 100, facturasPendientes: 15, facturasRechazadas: 5, crecimientoVentas: 12.5 }
const ventasDia: VentasPorDia[] = [{ fecha: '2026-03-01T00:00:00Z', cantidadFacturas: 4, totalVentas: 1200 }, { fecha: '2026-03-02T00:00:00Z', cantidadFacturas: 6, totalVentas: 2100 }]
const topProd: ProductoMasVendido[] = [{ productoId: 2, nombreProducto: 'Escritorio', cantidadVendida: 30, totalVentas: 9000 }]
const porCategoria: VentasPorCategoria[] = [{ categoriaId: 1, nombreCategoria: 'Muebles', totalVentas: 20000, cantidadVendidaReales: 120, cantidadProductos: 8 }]
const porVendedor: VentasPorVendedor[] = [{ vendedorId: 1, codigoVendedor: 'V01', nombreVendedor: 'Ana Vendedora', totalVentas: 15000, cantidadFacturas: 40, promedioVenta: 375 }]
const comparativo: PagedResult<ComparativoSucursal> = { items: [{ sucursalId: 2, codigoSucursal: 'S02', nombreSucursal: 'Casa Matriz', totalFacturas: 120, totalVentas: 45000, promedioVenta: 375, porcentajeDelTotal: 100 }], totalItems: 1, pageNumber: 1, pageSize: 50, totalPages: 1, hasPreviousPage: false, hasNextPage: false }
const catDetalle: PagedResult<VentaCategoriaDetalle> = { items: [{ facturaDetalleId: 1, facturaId: 10, numeroControl: 'DTE-01-0001', codigoGeneracion: 'ABC', fechaEmision: '2026-03-02T10:00:00Z', productoId: 2, productoNombre: 'Escritorio', categoriaId: 1, categoriaNombre: 'Muebles', cantidad: 2, totalVenta: 600, receptorNombre: 'Cliente X', sucursalId: 2, sucursalNombre: 'Casa Matriz' }], totalItems: 1, pageNumber: 1, pageSize: 50, totalPages: 1, hasPreviousPage: false, hasNextPage: false }
const vendDetalle: PagedResult<VentaVendedorDetalle> = { items: [{ facturaId: 10, numeroControl: 'DTE-01-0001', codigoGeneracion: 'ABC', fechaEmision: '2026-03-02T10:00:00Z', receptorNombre: 'Cliente X', totalPagar: 600, estadoHacienda: 'APROBADO', vendedorId: 1, vendedorCodigo: 'V01', vendedorNombre: 'Ana Vendedora', sucursalId: 2, sucursalNombre: 'Casa Matriz' }], totalItems: 1, pageNumber: 1, pageSize: 50, totalPages: 1, hasPreviousPage: false, hasNextPage: false }
const cajero: DashboardCajero = { totalFacturas: 20, montoTotalVendido: 7500, promedioVenta: 375, ventasPorDia: [{ fecha: '2026-03-02T00:00:00Z', cantidadFacturas: 3, montoTotal: 1100 }] }

export const dashboardHandlers = [
  http.get(`${base}/dashboard/kpis`, () => HttpResponse.json(kpisEjemplo)),
  http.get(`${base}/dashboard/ventas-por-dia`, () => HttpResponse.json(ventasDia)),
  http.get(`${base}/dashboard/productos-mas-vendidos`, () => HttpResponse.json(topProd)),
  http.get(`${base}/dashboard/ventas-por-categoria`, () => HttpResponse.json(porCategoria)),
  http.get(`${base}/dashboard/ventas-por-categoria/detalle`, () => HttpResponse.json(catDetalle)),
  http.get(`${base}/dashboard/ventas-por-vendedor`, () => HttpResponse.json(porVendedor)),
  http.get(`${base}/dashboard/ventas-por-vendedor/detalle`, () => HttpResponse.json(vendDetalle)),
  http.get(`${base}/dashboard/comparativo-sucursales`, () => HttpResponse.json(comparativo)),
  http.get(`${base}/dashboard/cajero`, () => HttpResponse.json(cajero)),
]
