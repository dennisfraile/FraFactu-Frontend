// src/features/inventario/pages/ProductoFormPage.tsx
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, FormField, Input, Spinner, useToast } from '@/design-system'
import { useCatalogo, useSucursales } from '@/features/facturacion/hooks'
import { useProducto, useCrearProducto, useActualizarProducto, useCategorias, useMarcas, useCrearCategoria, useCrearMarca } from '../hooks'
import { productoSchema } from '../schemas'
import { TIPO_INVENTARIO } from '../types'
import { TributosProductoSection } from '../components/TributosProductoSection'
import { CategoriaFormModal } from '../components/CategoriaFormModal'
import { MarcaFormModal } from '../components/MarcaFormModal'
import type { ProductoDetalle, CrearProductoDto, ProductoTributo } from '../types'

export function ProductoFormPage() {
  const { id } = useParams<{ id: string }>()
  const editId = id ? Number(id) : null
  const detalle = useProducto(editId ?? NaN)
  if (editId && detalle.isLoading) return <div className="p-6"><Spinner /></div>
  return <ProductoForm key={editId ?? 'nuevo'} editId={editId} inicial={editId ? detalle.data ?? null : null} />
}

function ProductoForm({ editId, inicial }: { editId: number | null; inicial: ProductoDetalle | null }) {
  const navigate = useNavigate()
  const toast = useToast()
  const crear = useCrearProducto()
  const actualizar = useActualizarProducto()
  const unidades = useCatalogo('unidadesMedida')
  const tipos = useCatalogo('tiposItems')
  const sucursales = useSucursales()
  const categorias = useCategorias()
  const marcas = useMarcas()
  const crearCat = useCrearCategoria()
  const crearMarca = useCrearMarca()

  const [codigo, setCodigo] = useState(inicial?.codigo ?? '')
  const [nombre, setNombre] = useState(inicial?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? '')
  const [precioVenta, setPrecioVenta] = useState(inicial?.precioVenta ?? 0)
  const [precioCosto, setPrecioCosto] = useState<number | ''>(inicial?.precioCosto ?? '')
  const [catUnidadMedidaId, setUnidad] = useState<number>(inicial?.unidadMedida.id ?? 0)
  const [catTipoItemId, setTipoItem] = useState<number>(inicial?.tipoItem.id ?? 0)
  const [codigoBarras, setCodigoBarras] = useState(inicial?.codigoBarras ?? '')
  const [categoriaId, setCategoriaId] = useState<number | ''>(inicial?.categoriaId ?? '')
  const [marcaId, setMarcaId] = useState<number | ''>(inicial?.marcaId ?? '')
  const [tipoImpuesto, setTipoImpuesto] = useState(inicial?.tipoImpuesto ?? 1)
  const [porcentajeIVA, setPorcentajeIVA] = useState<number | ''>(inicial?.porcentajeIVA ?? 13)
  const [precioIncluyeIva, setPrecioIncluyeIva] = useState(inicial?.precioIncluyeIva ?? false)
  const [costoIncluyeIva, setCostoIncluyeIva] = useState(inicial?.costoIncluyeIva ?? false)
  const [stockMinimo, setStockMinimo] = useState<number | ''>(inicial?.stockMinimo ?? '')
  const [stockMaximo, setStockMaximo] = useState<number | ''>(inicial?.stockMaximo ?? '')
  const [puntoReorden, setPuntoReorden] = useState<number | ''>(inicial?.puntoReorden ?? '')
  const [permiteVentaSinStock, setPermiteVentaSinStock] = useState(inicial?.permiteVentaSinStock ?? false)
  const [tipoInventario, setTipoInventario] = useState(inicial?.tipoInventario ?? 0)
  const [fechaAdquisicion, setFechaAdquisicion] = useState(inicial?.fechaAdquisicion?.slice(0, 10) ?? '')
  const [aniosVidaUtil, setAniosVidaUtil] = useState<number | ''>(inicial?.aniosVidaUtil ?? '')
  const [valorActual, setValorActual] = useState<number | ''>(inicial?.valorActual ?? '')
  const [valorResidual, setValorResidual] = useState<number | ''>(inicial?.valorResidual ?? '')
  const [accesoTodasSucursales, setAccesoTodas] = useState(inicial?.accesoTodasSucursales ?? true)
  const [sucursalIds, setSucursalIds] = useState<number[]>(inicial?.sucursales.map((s) => s.sucursalId) ?? [])
  const [tributos, setTributos] = useState<ProductoTributo[]>(inicial?.tributosAdicionales ?? [])
  const [catModal, setCatModal] = useState(false)
  const [marcaModal, setMarcaModal] = useState(false)

  const num = (v: number | '') => (v === '' ? null : Number(v))
  const esActivo = tipoInventario === TIPO_INVENTARIO.MOBILIARIO_EQUIPO

  const onGuardar = async () => {
    const dto: CrearProductoDto = {
      codigo: codigo.trim(), nombre: nombre.trim(), descripcion: descripcion.trim() || null,
      precioVenta: Number(precioVenta), catUnidadMedidaId, catTipoItemId, codigoBarras: codigoBarras.trim() || null,
      categoriaId: categoriaId === '' ? null : Number(categoriaId), marcaId: marcaId === '' ? null : Number(marcaId),
      precioCosto: num(precioCosto), tipoImpuesto, porcentajeIVA: num(porcentajeIVA), precioIncluyeIva, costoIncluyeIva,
      stockMinimo: num(stockMinimo), stockMaximo: num(stockMaximo), puntoReorden: num(puntoReorden), permiteVentaSinStock,
      tipoInventario, fechaAdquisicion: esActivo && fechaAdquisicion ? `${fechaAdquisicion}T00:00:00Z` : null,
      aniosVidaUtil: esActivo ? num(aniosVidaUtil) : null, valorActual: esActivo ? num(valorActual) : null,
      valorResidual: esActivo ? num(valorResidual) : null, accesoTodasSucursales,
      sucursalIds: accesoTodasSucursales ? null : sucursalIds, tributosAdicionales: tributos.length ? tributos : null,
    }
    const res = productoSchema.safeParse(dto)
    if (!res.success) { toast.show(res.error.issues[0]?.message ?? 'Revise el formulario', { tone: 'rojo' }); return }
    try {
      if (editId) await actualizar.mutateAsync({ id: editId, dto })
      else await crear.mutateAsync(dto)
      toast.show(editId ? 'Producto actualizado' : 'Producto creado')
      navigate('/inventario/productos')
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: string; message?: string } } })?.response?.data
      toast.show(msg?.error ?? msg?.message ?? 'No se pudo guardar el producto', { tone: 'rojo' })
    }
  }

  const inputSel = 'w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark'
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold text-ink">{editId ? 'Editar producto' : 'Nuevo producto'}</h1>

      <section className="grid gap-3 md:grid-cols-2">
        <FormField label="Código" htmlFor="p-codigo"><Input id="p-codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} /></FormField>
        <FormField label="Código de barras (opcional)" htmlFor="p-barras"><Input id="p-barras" value={codigoBarras ?? ''} onChange={(e) => setCodigoBarras(e.target.value)} /></FormField>
        <FormField label="Nombre" htmlFor="p-nombre"><Input id="p-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} /></FormField>
        <FormField label="Descripción (opcional)" htmlFor="p-desc"><Input id="p-desc" value={descripcion ?? ''} onChange={(e) => setDescripcion(e.target.value)} /></FormField>
        <FormField label="Unidad de medida" htmlFor="p-unidad">
          <select id="p-unidad" className={inputSel} value={catUnidadMedidaId} onChange={(e) => setUnidad(Number(e.target.value))}>
            <option value={0}>Seleccione…</option>
            {(unidades.data ?? []).map((u) => <option key={u.id} value={u.id}>{u.valor}</option>)}
          </select>
        </FormField>
        <FormField label="Tipo de ítem" htmlFor="p-tipoitem">
          <select id="p-tipoitem" className={inputSel} value={catTipoItemId} onChange={(e) => setTipoItem(Number(e.target.value))}>
            <option value={0}>Seleccione…</option>
            {(tipos.data ?? []).map((t) => <option key={t.id} value={t.id}>{t.valor}</option>)}
          </select>
        </FormField>
        <FormField label="Categoría (opcional)" htmlFor="p-cat">
          <div className="flex gap-2">
            <select id="p-cat" className={inputSel} value={categoriaId} onChange={(e) => setCategoriaId(e.target.value === '' ? '' : Number(e.target.value))}>
              <option value="">—</option>
              {(categorias.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            <Button variant="ghost" onClick={() => setCatModal(true)}>+</Button>
          </div>
        </FormField>
        <FormField label="Marca (opcional)" htmlFor="p-marca">
          <div className="flex gap-2">
            <select id="p-marca" className={inputSel} value={marcaId} onChange={(e) => setMarcaId(e.target.value === '' ? '' : Number(e.target.value))}>
              <option value="">—</option>
              {(marcas.data ?? []).map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
            <Button variant="ghost" onClick={() => setMarcaModal(true)}>+</Button>
          </div>
        </FormField>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <FormField label="Precio de venta" htmlFor="p-pv"><Input id="p-pv" type="number" value={precioVenta} onChange={(e) => setPrecioVenta(Number(e.target.value))} /></FormField>
        <FormField label="Precio de costo (opcional)" htmlFor="p-pc"><Input id="p-pc" type="number" value={precioCosto} onChange={(e) => setPrecioCosto(e.target.value === '' ? '' : Number(e.target.value))} /></FormField>
        <FormField label="Tipo de impuesto" htmlFor="p-imp">
          <select id="p-imp" className={inputSel} value={tipoImpuesto} onChange={(e) => setTipoImpuesto(Number(e.target.value))}>
            <option value={1}>Gravado (IVA)</option><option value={2}>Exento</option><option value={3}>No sujeto</option>
          </select>
        </FormField>
        <FormField label="% IVA" htmlFor="p-iva"><Input id="p-iva" type="number" value={porcentajeIVA} onChange={(e) => setPorcentajeIVA(e.target.value === '' ? '' : Number(e.target.value))} /></FormField>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={precioIncluyeIva} onChange={(e) => setPrecioIncluyeIva(e.target.checked)} />El precio de venta incluye IVA</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={costoIncluyeIva} onChange={(e) => setCostoIncluyeIva(e.target.checked)} />El costo incluye IVA</label>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <FormField label="Stock mínimo" htmlFor="p-smin"><Input id="p-smin" type="number" value={stockMinimo} onChange={(e) => setStockMinimo(e.target.value === '' ? '' : Number(e.target.value))} /></FormField>
        <FormField label="Stock máximo" htmlFor="p-smax"><Input id="p-smax" type="number" value={stockMaximo} onChange={(e) => setStockMaximo(e.target.value === '' ? '' : Number(e.target.value))} /></FormField>
        <FormField label="Punto de reorden" htmlFor="p-reorden"><Input id="p-reorden" type="number" value={puntoReorden} onChange={(e) => setPuntoReorden(e.target.value === '' ? '' : Number(e.target.value))} /></FormField>
        <label className="flex items-center gap-2 text-sm md:col-span-3"><input type="checkbox" checked={permiteVentaSinStock} onChange={(e) => setPermiteVentaSinStock(e.target.checked)} />Permite venta sin existencia</label>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <FormField label="Tipo de inventario" htmlFor="p-tipoinv">
          <select id="p-tipoinv" className={inputSel} value={tipoInventario} onChange={(e) => setTipoInventario(Number(e.target.value))}>
            <option value={0}>Ventas</option><option value={1}>Mobiliario y equipo (activo fijo)</option><option value={2}>Insumos</option>
          </select>
        </FormField>
        {esActivo && <>
          <FormField label="Fecha de adquisición" htmlFor="p-fadq"><Input id="p-fadq" type="date" value={fechaAdquisicion} onChange={(e) => setFechaAdquisicion(e.target.value)} /></FormField>
          <FormField label="Años de vida útil" htmlFor="p-vida"><Input id="p-vida" type="number" value={aniosVidaUtil} onChange={(e) => setAniosVidaUtil(e.target.value === '' ? '' : Number(e.target.value))} /></FormField>
          <FormField label="Valor actual" htmlFor="p-vactual"><Input id="p-vactual" type="number" value={valorActual} onChange={(e) => setValorActual(e.target.value === '' ? '' : Number(e.target.value))} /></FormField>
          <FormField label="Valor residual" htmlFor="p-vres"><Input id="p-vres" type="number" value={valorResidual} onChange={(e) => setValorResidual(e.target.value === '' ? '' : Number(e.target.value))} /></FormField>
        </>}
      </section>

      <section className="space-y-2">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={accesoTodasSucursales} onChange={(e) => setAccesoTodas(e.target.checked)} />Disponible en todas las sucursales</label>
        {!accesoTodasSucursales && (
          <div className="flex flex-wrap gap-3">
            {(sucursales.data ?? []).map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={sucursalIds.includes(s.id)} onChange={(e) => setSucursalIds(e.target.checked ? [...sucursalIds, s.id] : sucursalIds.filter((x) => x !== s.id))} />{s.nombre}
              </label>
            ))}
          </div>
        )}
      </section>

      <TributosProductoSection tributos={tributos} onChange={setTributos} />

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => navigate('/inventario/productos')}>Cancelar</Button>
        <Button onClick={onGuardar} disabled={crear.isPending || actualizar.isPending}>{(crear.isPending || actualizar.isPending) ? 'Guardando…' : 'Guardar producto'}</Button>
      </div>

      {catModal && <CategoriaFormModal onGuardar={async (dto) => { try { const c = await crearCat.mutateAsync(dto); setCategoriaId(c.id); setCatModal(false) } catch { toast.show('No se pudo crear la categoría', { tone: 'rojo' }) } }} onClose={() => setCatModal(false)} cargando={crearCat.isPending} />}
      {marcaModal && <MarcaFormModal onGuardar={async (dto) => { try { const m = await crearMarca.mutateAsync(dto); setMarcaId(m.id); setMarcaModal(false) } catch { toast.show('No se pudo crear la marca', { tone: 'rojo' }) } }} onClose={() => setMarcaModal(false)} cargando={crearMarca.isPending} />}
    </div>
  )
}
