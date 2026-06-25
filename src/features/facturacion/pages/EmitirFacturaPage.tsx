// src/features/facturacion/pages/EmitirFacturaPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, useToast } from '@/design-system'
import { useAuthStore } from '@/app/auth-store'
import { DatosGeneralesSection } from '../components/DatosGeneralesSection'
import { CuerpoDocumentoTable } from '../components/CuerpoDocumentoTable'
import { CierrePagoSection } from '../components/CierrePagoSection'
import { TotalesPanel } from '../components/TotalesPanel'
import { VistaPreviaDte } from '../components/VistaPreviaDte'
import { facturaFormSchema } from '../schemas'
import { buildCreateFacturaDto, type FormItem, type FormPago, type FacturaFormValues } from '../mappers'
import { useEmitirFactura } from '../hooks'
import type { CreateFacturaDto, ReceptorListItem } from '../types'

function ahora() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return { fecha: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, hora: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` }
}

export function EmitirFacturaPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const user = useAuthStore((s) => s.user)
  const emitir = useEmitirFactura()

  const [paso, setPaso] = useState<'captura' | 'preview'>('captura')
  const [sucursalId, setSucursalId] = useState<number>(user?.sucursalIds?.[0] ?? 1)
  const [cajaId, setCajaId] = useState<number | null>(null)
  const [esConsumidorFinal, setEsConsumidorFinal] = useState(true)
  const [receptor, setReceptor] = useState<ReceptorListItem | null>(null)
  const [vendedorId, setVendedorId] = useState<number | null>(null)
  const [condicionOperacion, setCondicionOperacion] = useState(1)
  const [items, setItems] = useState<FormItem[]>([])
  const [pagos, setPagos] = useState<FormPago[]>([{ catFormaPagoId: 1, monto: 0 }])

  const values: FacturaFormValues = {
    sucursalId, cajaId, esConsumidorFinal, receptorId: receptor?.id ?? null, vendedorId, condicionOperacion, items, pagos,
  }

  // Snapshot del DTO armado al entrar a la vista previa (no se recalcula en cada render).
  const [dtoPreview, setDtoPreview] = useState<CreateFacturaDto | null>(null)

  const irAPreview = () => {
    const res = facturaFormSchema.safeParse(values)
    if (!res.success) {
      toast.show(res.error.issues[0]?.message ?? 'Revise el formulario', { tone: 'rojo' })
      return
    }
    try {
      setDtoPreview(buildCreateFacturaDto(values, ahora()))
    } catch {
      toast.show('No se pudo armar la vista previa', { tone: 'rojo' })
      return
    }
    setPaso('preview')
  }

  const onEmitir = async () => {
    try {
      const dto = buildCreateFacturaDto(values, ahora())
      const factura = await emitir.mutateAsync(dto)
      toast.show('Factura emitida (pendiente de envío a MH)')
      navigate(`/facturacion/${factura.id}`)
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'No se pudo emitir la factura'
      toast.show(msg, { tone: 'rojo' })
    }
  }

  if (paso === 'preview' && dtoPreview) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Button variant="ghost" onClick={() => setPaso('captura')} className="mb-4">‹ Atrás</Button>
        <VistaPreviaDte dto={dtoPreview} ambiente="00" onEmitir={onEmitir} emitiendo={emitir.isPending} />
      </div>
    )
  }

  return (
    <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-ink">Emitir Factura (01)</h1>
        <DatosGeneralesSection
          sucursalId={sucursalId} onSucursalId={setSucursalId}
          cajaId={cajaId} onCajaId={setCajaId}
          esConsumidorFinal={esConsumidorFinal} onEsConsumidorFinal={setEsConsumidorFinal}
          receptor={receptor} onReceptor={setReceptor}
          vendedorId={vendedorId} onVendedorId={setVendedorId}
          condicionOperacion={condicionOperacion} onCondicionOperacion={setCondicionOperacion}
        />
        <CuerpoDocumentoTable items={items} onChange={setItems} sucursalId={sucursalId} />
        <CierrePagoSection pagos={pagos} onChange={setPagos} />
        <Button onClick={irAPreview}>Revisar y emitir ›</Button>
      </div>
      <TotalesPanel items={items} />
    </div>
  )
}
