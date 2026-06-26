// src/features/compras/pages/CompraFormPage.tsx
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, FormField, Input, Spinner, useToast } from '@/design-system'
import { useAuthStore } from '@/app/auth-store'
import { useSucursales } from '@/features/facturacion/hooks'
import { ProveedorPicker } from '../components/ProveedorPicker'
import { CompraLineasTable } from '../components/CompraLineasTable'
import { CompraTotalesPanel } from '../components/CompraTotalesPanel'
import { compraSchema } from '../schemas'
import { buildCrearCompraDto, nuevaLineaProducto, nuevaLineaGasto, type CompraFormValues, type FormProductoLinea, type FormGastoLinea } from '../mappers'
import { useCrearCompra, useActualizarCompra, useEditarCompraConfirmada, useCompra } from '../hooks'
import type { CompraExternaDto } from '../types'

function hoy() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Reconstruye los valores del form desde una compra existente (edición).
function desdeCompra(c: CompraExternaDto): CompraFormValues {
  return {
    proveedorId: c.proveedorId, sucursalId: c.sucursalId, numeroFactura: c.numeroFactura,
    fechaEmision: c.fechaEmision.slice(0, 10), observaciones: c.observaciones ?? '',
    productos: c.detalles.map<FormProductoLinea>((d) => ({ ...nuevaLineaProducto(), productoId: d.productoId, codigo: d.productoCodigo, descripcion: d.productoNombre, bodegaId: d.bodegaId, cantidad: d.cantidad, costoUnitario: d.costoUnitario, aplicaIva: d.iva > 0, ivaManual: d.iva, esParaInventario: d.esParaInventario })),
    gastos: c.gastos.map<FormGastoLinea>((g) => ({ ...nuevaLineaGasto(), descripcion: g.descripcion, monto: g.monto, catTipoGastoId: g.catTipoGastoId ?? null, centroCosto: g.centroCosto ?? '', cuentaContable: g.cuentaContable ?? '' })),
  }
}

// Inner form: recibe los valores iniciales ya resueltos y la compra existente (si edición).
function CompraForm({ initialValues, initialProveedorNombre, compra }: { initialValues: CompraFormValues; initialProveedorNombre: string; compra: CompraExternaDto | undefined }) {
  const navigate = useNavigate()
  const toast = useToast()
  const sucursales = useSucursales()
  const crear = useCrearCompra()
  const actualizar = useActualizarCompra()
  const editarConfirmada = useEditarCompraConfirmada()

  const editId = compra?.id ?? null
  const [proveedorNombre, setProveedorNombre] = useState(initialProveedorNombre)
  const [values, setValues] = useState<CompraFormValues>(initialValues)
  const [error, setError] = useState<string | null>(null)

  const esConfirmada = compra?.estado === 'CONFIRMADA'
  const set = (patch: Partial<CompraFormValues>) => setValues((v) => ({ ...v, ...patch }))

  const guardar = async () => {
    // Verificación anticipada de líneas para mostrar el mensaje correcto primero.
    if (values.productos.length === 0 && values.gastos.length === 0) {
      setError('Agregue al menos una línea (producto o gasto)')
      return
    }
    const res = compraSchema.safeParse(values)
    if (!res.success) { setError(res.error.issues[0]?.message ?? 'Revise el formulario'); return }
    setError(null)
    const dto = buildCrearCompraDto(values)
    try {
      let saved: CompraExternaDto
      if (!editId) saved = await crear.mutateAsync(dto)
      else if (esConfirmada) saved = await editarConfirmada.mutateAsync({ id: editId, dto })
      else saved = await actualizar.mutateAsync({ id: editId, dto })
      toast.show('Compra guardada')
      navigate(`/compras/${saved.id}`)
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error
        ?? (e as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'No se pudo guardar la compra'
      toast.show(msg, { tone: 'rojo' })
    }
  }

  const guardando = crear.isPending || actualizar.isPending || editarConfirmada.isPending

  return (
    <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-ink">{editId ? 'Editar compra' : 'Nueva compra externa'}</h1>
        {esConfirmada && <p className="rounded-md bg-oro/10 px-3 py-2 text-sm text-oro-ink">Esta compra está CONFIRMADA: guardar reajustará el inventario.</p>}
        {error && <p className="rounded-md bg-rojo/10 px-3 py-2 text-sm text-rojo">{error}</p>}

        <section className="space-y-3">
          <FormField label="Proveedor" htmlFor="c-prov">
            {values.proveedorId
              ? <div className="flex items-center gap-3 text-sm"><span>{proveedorNombre}</span><button type="button" className="text-xs text-sello hover:underline" onClick={() => { set({ proveedorId: null }); setProveedorNombre('') }}>Cambiar</button></div>
              : <ProveedorPicker onSelect={(p) => { set({ proveedorId: p.id }); setProveedorNombre(`${p.nombre} — ${p.nit}`) }} />}
          </FormField>
          <div className="grid grid-cols-3 gap-2">
            <FormField label="Sucursal" htmlFor="c-suc">
              <select id="c-suc" className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark" value={values.sucursalId ?? ''} onChange={(e) => set({ sucursalId: e.target.value ? Number(e.target.value) : null })}>
                <option value="">Seleccione…</option>
                {(sucursales.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </FormField>
            <FormField label="Número de factura" htmlFor="c-num"><Input id="c-num" value={values.numeroFactura} onChange={(e) => set({ numeroFactura: e.target.value })} /></FormField>
            <FormField label="Fecha de emisión" htmlFor="c-fec"><Input id="c-fec" type="date" value={values.fechaEmision} onChange={(e) => set({ fechaEmision: e.target.value })} /></FormField>
          </div>
          <FormField label="Observaciones (opcional)" htmlFor="c-obs"><Input id="c-obs" value={values.observaciones} onChange={(e) => set({ observaciones: e.target.value })} /></FormField>
        </section>

        <CompraLineasTable
          productos={values.productos} onProductos={(productos) => set({ productos })}
          gastos={values.gastos} onGastos={(gastos) => set({ gastos })}
          sucursalId={values.sucursalId}
        />

        <Button onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : esConfirmada ? 'Guardar cambios (reajusta inventario)' : 'Guardar borrador'}</Button>
      </div>
      <CompraTotalesPanel productos={values.productos} gastos={values.gastos} />
    </div>
  )
}

// Outer loader: resuelve la compra existente antes de montar el form con valores iniciales.
export function CompraFormPage() {
  const { id } = useParams()
  const editId = id ? Number(id) : null
  const user = useAuthStore((s) => s.user)
  const compraExistente = useCompra(editId ?? NaN)

  if (editId && compraExistente.isLoading) return <div className="p-6"><Spinner /></div>

  const compra = compraExistente.data
  const initialValues: CompraFormValues = compra
    ? desdeCompra(compra)
    : { proveedorId: null, sucursalId: user?.sucursalIds?.[0] ?? 1, numeroFactura: '', fechaEmision: hoy(), observaciones: '', productos: [], gastos: [] }
  const initialProveedorNombre = compra?.proveedorNombre ?? ''

  return <CompraForm key={editId ?? 'nueva'} initialValues={initialValues} initialProveedorNombre={initialProveedorNombre} compra={compra} />
}
