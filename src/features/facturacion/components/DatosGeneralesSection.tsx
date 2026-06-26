// src/features/facturacion/components/DatosGeneralesSection.tsx
import { useEffect } from 'react'
import { FormField } from '@/design-system'
import { ReceptorPicker } from './ReceptorPicker'
import { QuickCreateSelect } from './QuickCreateSelect'
import { ReceptorFormModal } from './ReceptorFormModal'
import { receptoresApi } from '../catalogos-api'
import { useSucursales, useVendedores, useCatalogo, useCajas } from '../hooks'
import type { DteStrategy } from '../dte/strategy'
import type { Sucursal, Vendedor, ReceptorListItem, CajaDto } from '../types'

interface Props {
  strategy: DteStrategy
  sucursalId: number
  onSucursalId: (id: number) => void
  cajaId: number | null
  onCajaId: (id: number | null) => void
  esConsumidorFinal: boolean
  onEsConsumidorFinal: (v: boolean) => void
  receptor: ReceptorListItem | null
  onReceptor: (r: ReceptorListItem | null) => void
  vendedorId: number | null
  onVendedorId: (id: number | null) => void
  condicionOperacion: number
  onCondicionOperacion: (c: number) => void
  esAgenteRetencion: boolean
  onEsAgenteRetencion: (v: boolean) => void
}

export function DatosGeneralesSection(p: Props) {
  const sucursales = useSucursales()
  const vendedores = useVendedores(p.sucursalId)
  const condiciones = useCatalogo('condicionesOperacion')
  const cajas = useCajas(p.sucursalId)

  const requiereCaja = p.strategy.requiereCaja
  const receptorOpcional = p.strategy.receptorPolicy === 'opcional'

  // Auto-selecciona la primera caja activa de la sucursal si el tipo requiere caja y no hay ninguna.
  const cajasData = cajas.data
  const cajaActualId = p.cajaId
  const onCajaId = p.onCajaId
  useEffect(() => {
    if (requiereCaja && cajaActualId == null && cajasData && cajasData.length > 0) {
      onCajaId(cajasData[0].id)
    }
  }, [requiereCaja, cajasData, cajaActualId, onCajaId])

  const receptorLabel = p.strategy.receptorPolicy === 'sujetoExcluido' ? 'Sujeto excluido (proveedor)' : 'Receptor'

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-slate/80"><span className="h-1.5 w-1.5 rounded-full bg-oro" />Datos generales</h2>
      <FormField label="Sucursal" htmlFor="sucursal">
        <select id="sucursal" className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark"
          value={p.sucursalId} onChange={(e) => p.onSucursalId(Number(e.target.value))}>
          {(sucursales.data ?? []).map((s: Sucursal) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
      </FormField>
      {requiereCaja && (
        <FormField label="Caja" htmlFor="caja">
          <select id="caja" className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark"
            value={p.cajaId ?? ''} onChange={(e) => p.onCajaId(e.target.value ? Number(e.target.value) : null)}>
            <option value="">Seleccione una caja</option>
            {(cajas.data ?? []).map((c: CajaDto) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </FormField>
      )}
      {!p.strategy.requiereDocumentoRelacionado && receptorOpcional && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={p.esConsumidorFinal} onChange={(e) => p.onEsConsumidorFinal(e.target.checked)} />
          Consumidor Final
        </label>
      )}
      {!p.strategy.requiereDocumentoRelacionado && (!receptorOpcional || !p.esConsumidorFinal) && (
        <FormField label={receptorLabel} htmlFor="receptor">
          {p.receptor ? (
            <div className="flex items-center justify-between rounded-md border border-hairline px-3 py-2 text-sm">
              <span>{p.receptor.nombreRazonSocial}</span>
              <button type="button" className="text-xs text-sello" onClick={() => p.onReceptor(null)}>Cambiar</button>
            </div>
          ) : receptorOpcional ? (
            <ReceptorPicker onSelect={p.onReceptor} />
          ) : (
            <QuickCreateSelect
              onSearch={(term) => receptoresApi.search(term)}
              getLabel={(r) => `${r.nombreRazonSocial}${r.numeroDocumento ? ` (${r.numeroDocumento})` : ''}`}
              onSelect={p.onReceptor}
              placeholder="Buscar receptor por nombre o documento"
              crearLabel={p.strategy.receptorPolicy === 'sujetoExcluido' ? 'Crear sujeto excluido' : 'Crear receptor'}
              renderCreateModal={({ onCreated, onClose }) => (
                <ReceptorFormModal
                  policy={p.strategy.receptorPolicy === 'sujetoExcluido' ? 'sujetoExcluido' : 'contribuyente'}
                  onCreated={onCreated}
                  onClose={onClose}
                />
              )}
            />
          )}
        </FormField>
      )}
      {p.strategy.usaAgenteRetencion && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={p.esAgenteRetencion} onChange={(e) => p.onEsAgenteRetencion(e.target.checked)} />
          Somos agente de retención IVA (retiene 1%)
        </label>
      )}
      <FormField label="Vendedor (opcional)" htmlFor="vendedor">
        <select id="vendedor" className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark"
          value={p.vendedorId ?? ''} onChange={(e) => p.onVendedorId(e.target.value ? Number(e.target.value) : null)}>
          <option value="">—</option>
          {(vendedores.data ?? []).map((v: Vendedor) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
        </select>
      </FormField>
      <FormField label="Condición de operación" htmlFor="condicion">
        <select id="condicion" className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark"
          value={p.condicionOperacion} onChange={(e) => p.onCondicionOperacion(Number(e.target.value))}>
          {(condiciones.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.valor}</option>)}
        </select>
      </FormField>
    </section>
  )
}
