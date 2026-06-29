import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { productosApi, categoriasApi, inventarioApi, reportesApi } from './api'

const base = 'http://localhost:8080/api'
const prod = { id: 1, codigo: 'P001', nombre: 'X', precioVenta: 10, activo: true, unidadMedida: 'Unidad', tipoItem: 'Bienes', tipoImpuesto: 1, precioIncluyeIva: true, costoIncluyeIva: false, fechaCreacion: '2026-06-01', accesoTodasSucursales: true, tipoInventario: 0, tributosAdicionales: [] }
const server = setupServer(
  http.get(`${base}/productosservicios`, ({ request }) => {
    const u = new URL(request.url)
    expect(u.searchParams.get('pageNumber')).toBe('1')
    return HttpResponse.json({ items: [prod], totalCount: 1, pageNumber: 1, pageSize: 20, totalPages: 1 })
  }),
  http.post(`${base}/productosservicios`, () => HttpResponse.json({ ...prod }, { status: 201 })),
  http.get(`${base}/categorias`, () => HttpResponse.json([{ id: 1, codigo: 'C1', nombre: 'Cat', totalProductos: 0, activo: true, fechaCreacion: '2026-06-01' }])),
  http.post(`${base}/inventario/ajustes`, () => HttpResponse.json({ ok: true })),
  http.get(`${base}/inventarioreportes/kpis`, () => HttpResponse.json({ totalProductos: 3 })),
)
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())

describe('inventario api', () => {
  it('productos listar manda paginado', async () => {
    const r = await productosApi.listar({ pageNumber: 1, pageSize: 20 })
    expect(r.items[0].codigo).toBe('P001')
  })
  it('productos crear', async () => {
    const r = await productosApi.crear({ codigo: 'P002', nombre: 'Y', precioVenta: 1, catUnidadMedidaId: 39, catTipoItemId: 1, tipoImpuesto: 1, precioIncluyeIva: false, costoIncluyeIva: false, tipoInventario: 0, accesoTodasSucursales: true })
    expect(r.id).toBe(1)
  })
  it('categorias listar', async () => { expect((await categoriasApi.listar()).length).toBe(1) })
  it('ajuste', async () => { await expect(inventarioApi.ajustar({ productoId: 1, bodegaId: 1, cantidad: -2, motivo: 'MERMA', observaciones: 'rotura en bodega' })).resolves.toBeTruthy() })
  it('kpis', async () => { expect((await reportesApi.kpis()).totalProductos).toBe(3) })
})
