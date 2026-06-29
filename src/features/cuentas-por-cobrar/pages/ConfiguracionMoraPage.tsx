// src/features/cuentas-por-cobrar/pages/ConfiguracionMoraPage.tsx
import { useState } from 'react'
import { Button, FormField, Input, Spinner, useToast } from '@/design-system'
import { useConfiguracionMora, useActualizarConfiguracionMora } from '../hooks'
import type { ConfiguracionCuotasDto } from '../types'

function MoraForm({ inicial }: { inicial: ConfiguracionCuotasDto }) {
  const actualizar = useActualizarConfiguracionMora()
  const toast = useToast()
  const [cfg, setCfg] = useState<ConfiguracionCuotasDto>(inicial)
  const set = (patch: Partial<ConfiguracionCuotasDto>) => setCfg((c) => ({ ...c, ...patch }))

  const guardar = async () => {
    try {
      await actualizar.mutateAsync(cfg)
      toast.show('Configuración guardada')
    } catch {
      toast.show('No se pudo guardar la configuración', { tone: 'rojo' })
    }
  }

  return (
    <div className="max-w-md space-y-3">
      <FormField label="Tasa de mora mensual (%)" htmlFor="cm-tasa">
        <Input
          id="cm-tasa"
          type="number"
          value={cfg.tasaMoraMensual}
          onChange={(e) => set({ tasaMoraMensual: Number(e.target.value) })}
        />
      </FormField>
      <FormField label="Días de gracia" htmlFor="cm-gracia">
        <Input
          id="cm-gracia"
          type="number"
          value={cfg.diasGracia}
          onChange={(e) => set({ diasGracia: Number(e.target.value) })}
        />
      </FormField>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={cfg.moraHabilitada}
          onChange={(e) => set({ moraHabilitada: e.target.checked })}
        />
        Mora habilitada
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={cfg.recordatoriosHabilitados}
          onChange={(e) => set({ recordatoriosHabilitados: e.target.checked })}
        />
        Recordatorios habilitados
      </label>
      <FormField label="Días antes para recordatorio" htmlFor="cm-dias-rec">
        <Input
          id="cm-dias-rec"
          type="number"
          value={cfg.diasAntesRecordatorio}
          onChange={(e) => set({ diasAntesRecordatorio: Number(e.target.value) })}
        />
      </FormField>
      <Button onClick={guardar} disabled={actualizar.isPending}>
        {actualizar.isPending ? 'Guardando…' : 'Guardar'}
      </Button>
    </div>
  )
}

export function ConfiguracionMoraPage() {
  const cfg = useConfiguracionMora()
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold text-ink">Configuración de mora</h1>
      {cfg.isLoading || !cfg.data ? (
        <Spinner />
      ) : (
        <MoraForm key={JSON.stringify(cfg.data)} inicial={cfg.data} />
      )}
    </div>
  )
}
