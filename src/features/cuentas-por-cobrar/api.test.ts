import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { cuentasPorCobrarApi } from './api'

const base = 'http://localhost:8080/api'
const plan = { id: 1, condicionOperacion: 2, montoTotal: 100, montoPagado: 0, saldoAdeudado: 100, estadoCobro: 'Pendiente', cuotas: [] }

const server = setupServer(
  http.get(`${base}/cuentas-por-cobrar`, ({ request }) => {
    const url = new URL(request.url)
    expect(url.searchParams.get('soloConSaldo')).toBe('true')
    return HttpResponse.json([plan])
  }),
  http.post(`${base}/cuentas-por-cobrar/1/cuotas/1/pagar`, () => HttpResponse.json(plan)),
  http.get(`${base}/cuentas-por-cobrar/reportes/antiguedad/pdf`, () =>
    HttpResponse.arrayBuffer(new ArrayBuffer(8), {
      headers: { 'content-disposition': 'attachment; filename="Antiguedad.pdf"', 'content-type': 'application/pdf' },
    })),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('cuentasPorCobrarApi', () => {
  it('listar manda soloConSaldo y devuelve los planes', async () => {
    const res = await cuentasPorCobrarApi.listar(true)
    expect(res[0].id).toBe(1)
  })
  it('pagarCuota postea y devuelve el plan', async () => {
    const res = await cuentasPorCobrarApi.pagarCuota(1, 1, { catFormaPagoId: 1 })
    expect(res.saldoAdeudado).toBe(100)
  })
  it('descargarAntiguedad dispara la descarga del blob', async () => {
    const click = vi.fn()
    const createEl = vi.spyOn(document, 'createElement')
    // jsdom no implementa createObjectURL/revoke: stub.
    ;(URL as unknown as { createObjectURL: () => string }).createObjectURL = () => 'blob:x'
    ;(URL as unknown as { revokeObjectURL: () => void }).revokeObjectURL = () => {}
    createEl.mockImplementationOnce(() => ({ href: '', download: '', click, remove: () => {} }) as unknown as HTMLAnchorElement)
    await cuentasPorCobrarApi.descargarAntiguedad('pdf')
    expect(click).toHaveBeenCalled()
    createEl.mockRestore()
  })
})
