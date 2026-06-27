// src/features/dtes-recibidos/pages/MapearDtePage.tsx
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, FormField, Spinner, EmptyState, useToast } from '@/design-system'
import { useAuthStore } from '@/app/auth-store'
import { useSucursales } from '@/features/facturacion/hooks'
import { useDteRecibido, useMapearYCrearCompra } from '../hooks'
import { parseDteLineas } from '../parse'
import { lineaDesdeParsed, buildMapearDto, type MapeoFormValues } from '../mappers'
import { mapeoSchema } from '../schemas'
import { calcCuadre } from '../calc/mapeo'
import { MapeoLineasTable } from '../components/MapeoLineasTable'
import type { DteRecibidoDto } from '../types'

// Helper local: sucursal por defecto del usuario (primera accesible).
function useAuthStoreSucursal(): number | null {
  return useAuthStore((s) => s.user?.sucursalIds?.[0] ?? null)
}

function MapearForm({ dte, initialValues }: { dte: DteRecibidoDto; initialValues: MapeoFormValues }) {
  const navigate = useNavigate()
  const toast = useToast()
  const sucursales = useSucursales()
  const mapear = useMapearYCrearCompra()
  const [values, setValues] = useState<MapeoFormValues>(initialValues)
  const [error, setError] = useState<string | null>(null)

  const dteCtx = { iva: dte.iva, subTotal: dte.subTotal }
  const cuadre = calcCuadre(values.lineas.map((l) => ({ accion: l.accion, cantidad: l.cantidad, costoUnitario: l.costoUnitario, montoDte: l.montoDte })), dte.total, dteCtx)

  const crear = async () => {
    const res = mapeoSchema.safeParse(values)
    if (!res.success) { setError(res.error.issues[0]?.message ?? 'Revise el formulario'); return }
    if (!cuadre.cuadra) { setError(`El total mapeado no cuadra con el DTE (diferencia $${cuadre.diferencia.toFixed(2)})`); return }
    setError(null)
    try {
      const dto = buildMapearDto(values)
      const saved = await mapear.mutateAsync({ id: dte.id, dto })
      toast.show('Compra creada desde el DTE')
      navigate(`/compras/${saved.compraId}`)
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error
        ?? (e as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'No se pudo crear la compra'
      toast.show(msg, { tone: 'rojo' })
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Mapear y crear compra</h1>
        <p className="text-sm text-slate">{dte.emisorNombre} · {dte.numeroControl ?? dte.codigoGeneracion} · Total <span className="cifra">${dte.total.toFixed(2)}</span></p>
      </div>
      {error && <p className="rounded-md bg-rojo/10 px-3 py-2 text-sm text-rojo">{error}</p>}

      <FormField label="Sucursal destino" htmlFor="m-suc">
        <select id="m-suc" className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark" value={values.sucursalId ?? ''} onChange={(e) => setValues((v) => ({ ...v, sucursalId: e.target.value ? Number(e.target.value) : null }))}>
          <option value="">Seleccione…</option>
          {(sucursales.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
      </FormField>

      <MapeoLineasTable lineas={values.lineas} onLineas={(lineas) => setValues((v) => ({ ...v, lineas }))} sucursalId={values.sucursalId} totalDte={dte.total} ivaDte={dte.iva} subTotalDte={dte.subTotal} />

      <Button onClick={crear} disabled={mapear.isPending || !cuadre.cuadra}>{mapear.isPending ? 'Creando…' : 'Crear compra (BORRADOR)'}</Button>
    </div>
  )
}

export function MapearDtePage() {
  const { id } = useParams()
  const dteId = Number(id)
  const user = useAuthStoreSucursal()
  const { data, isLoading, isError } = useDteRecibido(dteId)

  if (isLoading) return <div className="p-6"><Spinner /></div>
  if (isError || !data) return <div className="p-6"><EmptyState title="No se pudo cargar el DTE" hint="Intenta de nuevo." /></div>

  const initialValues: MapeoFormValues = {
    sucursalId: user ?? null,
    lineas: parseDteLineas(data.jsonDte).map(lineaDesdeParsed),
  }

  return <MapearForm key={dteId} dte={data} initialValues={initialValues} />
}
