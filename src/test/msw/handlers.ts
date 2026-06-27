import { http, HttpResponse } from 'msw'
import { facturacionHandlers } from './facturacion-handlers'
import { comprasHandlers } from './compras-handlers'
import { dtesRecibidosHandlers } from './dtes-recibidos-handlers'

const base = 'http://localhost:8080/api'
const loginOk = {
  token: 'header.eyJleHAiOjk5OTk5OTk5OTl9.sig', tokenType: 'Bearer', expiresIn: 3600,
  userId: 1, nombreCompleto: 'Ana', email: 'ana@x.com', rolId: 2, rolNombre: 'Admin',
  emisorId: 5, emisorNombre: 'Mi Empresa', accesoTodasSucursales: true, sucursalIds: [1],
  permisos: [], requiereCambioPwd: false,
}

export const handlers = [
  http.post(`${base}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }
    if (body.password === 'mala') return new HttpResponse(null, { status: 401 })
    if (body.email === 'primer@x.com') return HttpResponse.json({ ...loginOk, requiereCambioPwd: true })
    return HttpResponse.json(loginOk)
  }),
  http.post(`${base}/auth/google`, () => HttpResponse.json(loginOk)),
  http.post(`${base}/auth/forgot-password`, () => HttpResponse.json({ message: 'ok' })),
  http.post(`${base}/auth/reset-password`, async ({ request }) => {
    const b = (await request.json()) as { token: string }
    return b.token === 'malo' ? new HttpResponse(null, { status: 400 }) : HttpResponse.json({ message: 'ok' })
  }),
  http.post(`${base}/auth/change-password-first-login`, () => HttpResponse.json(loginOk)),
  http.post(`${base}/auth/logout`, () => HttpResponse.json({ message: 'ok' })),
  ...facturacionHandlers,
  ...comprasHandlers,
  ...dtesRecibidosHandlers,
]
