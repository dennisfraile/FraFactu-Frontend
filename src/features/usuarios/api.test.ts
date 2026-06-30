import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { usuariosApi, rolesApi, cajasApi } from './api'

const base = 'http://localhost:8080/api'
const server = setupServer(
  http.get(`${base}/usuarios`, () => HttpResponse.json({ items: [{ id: 1, nombreCompleto: 'Ana' }], currentPage: 1, totalPages: 1, pageSize: 10, totalCount: 1 })),
  http.post(`${base}/usuarios`, () => HttpResponse.json({ id: 9 }, { status: 201 })),
  http.put(`${base}/usuarios/9`, () => HttpResponse.json({ id: 9 })),
  http.patch(`${base}/usuarios/9/toggle-active`, () => HttpResponse.json({ activo: false })),
  http.delete(`${base}/usuarios/9`, () => new HttpResponse(null, { status: 204 })),
  http.get(`${base}/roles`, () => HttpResponse.json([{ id: 5, nombre: 'EmisorAdmin' }])),
  http.get(`${base}/cajas`, () => HttpResponse.json([{ id: 1, nombre: 'Caja 1', sucursalId: 2, codigo: 'C1' }])),
)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('usuariosApi', () => {
  it('listar devuelve la página', async () => {
    const r = await usuariosApi.listar({ pageNumber: 1, pageSize: 10 })
    expect(r.totalCount).toBe(1)
    expect(r.items[0].nombreCompleto).toBe('Ana')
  })
  it('crear devuelve el creado', async () => {
    const r = await usuariosApi.crear({ nombreCompleto: 'X', email: 'x@x.com', rolId: 5, accesoTodasSucursales: true, sucursalIds: [], cajaIds: [], requiereCambioPwd: false })
    expect(r.id).toBe(9)
  })
  it('roles y cajas', async () => {
    expect((await rolesApi.listar())[0].nombre).toBe('EmisorAdmin')
    expect((await cajasApi.listarTodas())[0].id).toBe(1)
  })
})
