import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cuentasPorCobrarApi } from './api'
import type {
  CrearVentaCreditoDto, RegistrarPagoCuotaDto, ActualizarConfiguracionCuotasDto, RefinanciarPlanDto,
} from './types'

export function usePlanes(soloConSaldo: boolean) {
  return useQuery({ queryKey: ['cxc-planes', soloConSaldo], queryFn: () => cuentasPorCobrarApi.listar(soloConSaldo) })
}

export function usePlan(planId: number) {
  return useQuery({
    queryKey: ['cxc-plan', planId],
    queryFn: () => cuentasPorCobrarApi.getById(planId),
    enabled: Number.isFinite(planId),
  })
}

export function useCrearVentaCredito() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CrearVentaCreditoDto) => cuentasPorCobrarApi.crear(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cxc-planes'] }),
  })
}

export function usePagarCuota() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ planId, numero, dto }: { planId: number; numero: number; dto: RegistrarPagoCuotaDto }) =>
      cuentasPorCobrarApi.pagarCuota(planId, numero, dto),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['cxc-planes'] })
      qc.invalidateQueries({ queryKey: ['cxc-plan', vars.planId] })
    },
  })
}

export function useRefinanciar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ planId, dto }: { planId: number; dto: RefinanciarPlanDto }) =>
      cuentasPorCobrarApi.refinanciar(planId, dto),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['cxc-planes'] })
      qc.invalidateQueries({ queryKey: ['cxc-plan', vars.planId] })
    },
  })
}

export function useConfiguracionMora() {
  return useQuery({ queryKey: ['cxc-config-mora'], queryFn: () => cuentasPorCobrarApi.getConfiguracion() })
}

export function useActualizarConfiguracionMora() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: ActualizarConfiguracionCuotasDto) => cuentasPorCobrarApi.actualizarConfiguracion(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cxc-config-mora'] }),
  })
}
