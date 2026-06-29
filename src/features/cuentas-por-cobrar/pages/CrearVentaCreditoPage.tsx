// src/features/cuentas-por-cobrar/pages/CrearVentaCreditoPage.tsx
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, FormField, Input, useToast } from '@/design-system'
import { useAuthStore } from '@/app/auth-store'
import { DatosGeneralesSection } from '@/features/facturacion/components/DatosGeneralesSection'
import { CuerpoDocumentoTable } from '@/features/facturacion/components/CuerpoDocumentoTable'
import { TotalesPanel } from '@/features/facturacion/components/TotalesPanel'
import { buildCreateFacturaDto, type FormItem, type FacturaFormValues } from '@/features/facturacion/mappers'
import { getStrategy } from '@/features/facturacion/dte/registry'
import { useCatalogo } from '@/features/facturacion/hooks'
import type { ReceptorListItem } from '@/features/facturacion/types'
import { useCrearVentaCredito } from '../hooks'
import { buildCrearVentaCreditoDto } from '../mappers'
import { CuotasBuilder } from '../components/CuotasBuilder'
import { validarCuotas, construirDefiniciones, type CuotaDraft, type ModoCuota } from '../calc/cuotas'

const TIPO = '01' // Venta a crédito sobre Factura

function ahora() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return { fecha: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, hora: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` }
}

export function CrearVentaCreditoPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const user = useAuthStore((s) => s.user)
  const crear = useCrearVentaCredito()
  const strategy = getStrategy(TIPO)
  const formas = useCatalogo('formasPago')

  const [sucursalId, setSucursalId] = useState<number>(user?.sucursalIds?.[0] ?? 1)
  const [cajaId, setCajaId] = useState<number | null>(null)
  const [receptor, setReceptor] = useState<ReceptorListItem | null>(null)
  const [vendedorId, setVendedorId] = useState<number | null>(null)
  const [condicionOperacion, setCondicionOperacion] = useState(2)
  const [items, setItems] = useState<FormItem[]>([])
  const [observaciones, setObservaciones] = useState('')
  const [catFormaPagoId, setCatFormaPagoId] = useState<number>(1)
  const [modo, setModo] = useState<ModoCuota>('monto')
  const [drafts, setDrafts] = useState<CuotaDraft[]>([
    { fechaPactada: '', valor: 0 },
    { fechaPactada: '', valor: 0 },
  ])

  const total = useMemo(() => {
    const calc = items
      .filter((i) => i.cantidad > 0 && i.precioUni >= 0)
      .map((i) =>
        strategy.calcItem({ cantidad: i.cantidad, precioUni: i.precioUni, montoDescuento: i.montoDescuento, tipoImpuesto: i.tipoImpuesto }),
      )
    return strategy.calcResumen(calc, { esAgenteRetencion: false }).totalPagar
  }, [items, strategy])

  const onCrear = async () => {
    if (condicionOperacion !== 2 && condicionOperacion !== 3) {
      toast.show('La condición debe ser Crédito o Mixto', { tone: 'rojo' })
      return
    }
    // La venta a crédito necesita un deudor identificado: el backend exige un receptor
    // registrado para emitir la factura de la cuota (no se admite Consumidor Final).
    if (!receptor) {
      toast.show('Seleccioná un receptor para la venta a crédito', { tone: 'rojo' })
      return
    }
    // Factura 01 exige caja; DatosGeneralesSection autoselecciona la primera, pero si la
    // sucursal no tiene cajas activas avisamos en vez de dejar fallar el backend.
    if (strategy.requiereCaja && cajaId == null) {
      toast.show('Seleccioná una caja para emitir la cuota', { tone: 'rojo' })
      return
    }
    const errCuotas = validarCuotas(drafts, modo, total)
    if (errCuotas) {
      toast.show(errCuotas, { tone: 'rojo' })
      return
    }

    const values: FacturaFormValues = {
      sucursalId,
      cajaId,
      esConsumidorFinal: false,
      receptorId: receptor?.id ?? null,
      vendedorId,
      condicionOperacion,
      esAgenteRetencion: false,
      items,
      pagos: [{ catFormaPagoId, monto: total }],
      documentoRelacionado: null,
    }
    try {
      const venta = buildCreateFacturaDto(values, ahora(), TIPO)
      const dto = buildCrearVentaCreditoDto(venta, construirDefiniciones(drafts, modo), observaciones)
      const plan = await crear.mutateAsync(dto)
      toast.show('Venta a crédito creada (cuota 1 emitida)')
      navigate(`/cuentas-por-cobrar/${plan.id}`)
    } catch (e) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'No se pudo crear la venta a crédito'
      toast.show(msg, { tone: 'rojo' })
    }
  }

  return (
    <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-ink">Nueva venta a crédito</h1>
        <DatosGeneralesSection
          strategy={strategy}
          sucursalId={sucursalId}
          onSucursalId={setSucursalId}
          cajaId={cajaId}
          onCajaId={setCajaId}
          esConsumidorFinal={false}
          onEsConsumidorFinal={() => {}}
          receptor={receptor}
          onReceptor={setReceptor}
          vendedorId={vendedorId}
          onVendedorId={setVendedorId}
          condicionOperacion={condicionOperacion}
          onCondicionOperacion={setCondicionOperacion}
          esAgenteRetencion={false}
          onEsAgenteRetencion={() => {}}
        />
        <CuerpoDocumentoTable
          items={items}
          onChange={setItems}
          sucursalId={sucursalId}
          descuentaStock={strategy.descuentaStock}
        />
        <FormField label="Forma de pago de la cuota inicial" htmlFor="cvc-forma">
          <select
            id="cvc-forma"
            className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark"
            value={catFormaPagoId}
            onChange={(e) => setCatFormaPagoId(Number(e.target.value))}
          >
            {(formas.data ?? []).map((f) => (
              <option key={f.id} value={f.id}>
                {f.valor}
              </option>
            ))}
          </select>
        </FormField>
        <CuotasBuilder total={total} drafts={drafts} modo={modo} onDrafts={setDrafts} onModo={setModo} />
        <FormField label="Observaciones (opcional)" htmlFor="cvc-obs">
          <Input id="cvc-obs" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
        </FormField>
        <Button onClick={onCrear} disabled={crear.isPending}>
          {crear.isPending ? 'Creando…' : 'Crear venta a crédito'}
        </Button>
      </div>
      <TotalesPanel items={items} tipoDte={TIPO} esAgenteRetencion={false} />
    </div>
  )
}
