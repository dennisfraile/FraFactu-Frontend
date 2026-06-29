import { http, HttpResponse } from 'msw'
import type { PlanCuotasDto, ConfiguracionCuotasDto, MoraEstimadaDto } from '@/features/cuentas-por-cobrar/types'

const base = 'http://localhost:8080/api'

export const planEjemplo: PlanCuotasDto = {
  id: 1, receptorId: 10, receptorNombre: 'Cliente Demo', condicionOperacion: 2,
  montoTotal: 100, montoPagado: 50, saldoAdeudado: 50, estadoCobro: 'Parcial',
  cuotas: [
    { numero: 1, monto: 50, fechaPactada: '2026-07-01', estado: 'Pagada', fechaPago: '2026-07-01', codigoGeneracion: 'GEN-1', facturaId: 100, esCuotaFinal: false, interesMora: 0 },
    { numero: 2, monto: 50, fechaPactada: '2026-08-01', estado: 'Pendiente', esCuotaFinal: true, interesMora: 0 },
  ],
}

export const configMoraEjemplo: ConfiguracionCuotasDto = {
  tasaMoraMensual: 2, diasGracia: 3, moraHabilitada: true, recordatoriosHabilitados: false, diasAntesRecordatorio: 2,
}

const moraEjemplo: MoraEstimadaDto = {
  numero: 2, monto: 50, fechaPactada: '2026-08-01', diasAtraso: 0, interesMora: 0, moraHabilitada: true,
}

export const cuentasPorCobrarHandlers = [
  http.get(`${base}/cuentas-por-cobrar`, () => HttpResponse.json([planEjemplo])),
  http.get(`${base}/cuentas-por-cobrar/1`, () => HttpResponse.json(planEjemplo)),
  http.post(`${base}/cuentas-por-cobrar`, () => HttpResponse.json(planEjemplo, { status: 201 })),
  http.get(`${base}/cuentas-por-cobrar/1/cuotas/2/mora-estimada`, () => HttpResponse.json(moraEjemplo)),
  http.post(`${base}/cuentas-por-cobrar/1/cuotas/2/pagar`, () =>
    HttpResponse.json({ ...planEjemplo, montoPagado: 100, saldoAdeudado: 0, estadoCobro: 'Pagado' })),
  http.post(`${base}/cuentas-por-cobrar/1/refinanciar`, () => HttpResponse.json({ ...planEjemplo, estadoCobro: 'Refinanciado' })),
  http.get(`${base}/cuentas-por-cobrar/configuracion-mora`, () => HttpResponse.json(configMoraEjemplo)),
  http.put(`${base}/cuentas-por-cobrar/configuracion-mora`, async ({ request }) =>
    HttpResponse.json((await request.json()) as ConfiguracionCuotasDto)),
]
