import { api } from '@/lib/http/axios'
import type {
  PlanCuotasDto, CrearVentaCreditoDto, RegistrarPagoCuotaDto, MoraEstimadaDto,
  ConfiguracionCuotasDto, ActualizarConfiguracionCuotasDto, RefinanciarPlanDto,
} from './types'

export type FormatoReporte = 'pdf' | 'excel'

const BASE = '/cuentas-por-cobrar'

async function descargarArchivo(url: string, fallbackName: string): Promise<void> {
  const res = await api.get(url, { responseType: 'blob' })
  const dispo = (res.headers['content-disposition'] as string | undefined) ?? ''
  const match = dispo.match(/filename="?([^";]+)"?/i)
  const nombre = match?.[1] ?? fallbackName
  const blobUrl = URL.createObjectURL(res.data as Blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = nombre
  a.click()
  a.remove()
  URL.revokeObjectURL(blobUrl)
}

export const cuentasPorCobrarApi = {
  async listar(soloConSaldo: boolean): Promise<PlanCuotasDto[]> {
    const { data } = await api.get<PlanCuotasDto[]>(BASE, { params: { soloConSaldo } })
    return data
  },
  async getById(planId: number): Promise<PlanCuotasDto> {
    const { data } = await api.get<PlanCuotasDto>(`${BASE}/${planId}`)
    return data
  },
  async crear(dto: CrearVentaCreditoDto): Promise<PlanCuotasDto> {
    const { data } = await api.post<PlanCuotasDto>(BASE, dto)
    return data
  },
  async pagarCuota(planId: number, numero: number, dto: RegistrarPagoCuotaDto): Promise<PlanCuotasDto> {
    const { data } = await api.post<PlanCuotasDto>(`${BASE}/${planId}/cuotas/${numero}/pagar`, dto)
    return data
  },
  async moraEstimada(planId: number, numero: number): Promise<MoraEstimadaDto> {
    const { data } = await api.get<MoraEstimadaDto>(`${BASE}/${planId}/cuotas/${numero}/mora-estimada`)
    return data
  },
  async getConfiguracion(): Promise<ConfiguracionCuotasDto> {
    const { data } = await api.get<ConfiguracionCuotasDto>(`${BASE}/configuracion-mora`)
    return data
  },
  async actualizarConfiguracion(dto: ActualizarConfiguracionCuotasDto): Promise<ConfiguracionCuotasDto> {
    const { data } = await api.put<ConfiguracionCuotasDto>(`${BASE}/configuracion-mora`, dto)
    return data
  },
  async refinanciar(planId: number, dto: RefinanciarPlanDto): Promise<PlanCuotasDto> {
    const { data } = await api.post<PlanCuotasDto>(`${BASE}/${planId}/refinanciar`, dto)
    return data
  },
  descargarAntiguedad(formato: FormatoReporte): Promise<void> {
    return descargarArchivo(`${BASE}/reportes/antiguedad/${formato}`, `Antiguedad_Saldos.${formato === 'pdf' ? 'pdf' : 'xlsx'}`)
  },
  descargarEstadoCuentaPlan(planId: number, formato: FormatoReporte): Promise<void> {
    return descargarArchivo(`${BASE}/reportes/estado-cuenta/plan/${planId}/${formato}`, `EstadoCuenta_Plan_${planId}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`)
  },
  descargarEstadoCuentaCliente(receptorId: number, formato: FormatoReporte): Promise<void> {
    return descargarArchivo(`${BASE}/reportes/estado-cuenta/cliente/${receptorId}/${formato}`, `EstadoCuenta_Cliente_${receptorId}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`)
  },
}
