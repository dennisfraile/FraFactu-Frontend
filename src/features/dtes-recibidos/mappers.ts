import { round2 } from './calc/mapeo'
import type { AccionMapeo, MapearDteCompraDto, MapearItemDto } from './types'
import type { DteLineaParsed } from './parse'

export interface ProductoNuevoForm {
  codigo: string
  nombre: string
  catTipoItemId: number | null
  catUnidadMedidaId: number | null
  categoriaId: number | null
  tipoInventario: number
  aniosVidaUtil: number | null
  valorResidual: number | null
}

export interface MapeoLineaForm {
  uid: number
  numItem: number
  descripcionDte: string
  montoDte: number
  accion: AccionMapeo
  productoId: number | null
  productoLabel: string
  cantidad: number
  bodegaId: number | null
  costoUnitario: number
  nuevo: ProductoNuevoForm
  catTipoGastoId: number | null
}

export interface MapeoFormValues {
  sucursalId: number | null
  lineas: MapeoLineaForm[]
}

let _uid = 0

export function nuevoProductoVacio(): ProductoNuevoForm {
  return { codigo: '', nombre: '', catTipoItemId: null, catUnidadMedidaId: null, categoriaId: null, tipoInventario: 0, aniosVidaUtil: null, valorResidual: null }
}

export function lineaDesdeParsed(item: DteLineaParsed): MapeoLineaForm {
  const cantidad = item.cantidad > 0 ? item.cantidad : 1
  return {
    uid: ++_uid,
    numItem: item.numItem,
    descripcionDte: item.descripcion,
    montoDte: item.montoConIva,
    accion: 'GASTO',
    productoId: null,
    productoLabel: '',
    cantidad,
    bodegaId: null,
    costoUnitario: round2(item.montoConIva / cantidad),
    nuevo: nuevoProductoVacio(),
    catTipoGastoId: null,
  }
}

export function buildMapearDto(v: MapeoFormValues): MapearDteCompraDto {
  if (!v.sucursalId) throw new Error('buildMapearDto: sucursalId requerido')
  const items: MapearItemDto[] = v.lineas.map((l) => {
    const base = { descripcionDte: l.descripcionDte.trim(), montoDte: round2(l.montoDte), accion: l.accion }
    if (l.accion === 'GASTO') {
      return { ...base, catTipoGastoId: l.catTipoGastoId }
    }
    if (l.accion === 'PRODUCTO_EXISTENTE') {
      if (!l.productoId) throw new Error('buildMapearDto: productoId requerido en línea de producto existente')
      return { ...base, productoId: l.productoId, cantidad: l.cantidad, bodegaId: l.bodegaId, costoUnitario: l.costoUnitario }
    }
    // PRODUCTO_NUEVO
    return {
      ...base,
      cantidad: l.cantidad,
      bodegaId: l.bodegaId,
      costoUnitario: l.costoUnitario,
      productoNuevo: {
        codigo: l.nuevo.codigo.trim(),
        nombre: l.nuevo.nombre.trim(),
        catTipoItemId: l.nuevo.catTipoItemId ?? 0,
        catUnidadMedidaId: l.nuevo.catUnidadMedidaId ?? 0,
        categoriaId: l.nuevo.categoriaId,
        tipoInventario: l.nuevo.tipoInventario,
        aniosVidaUtil: l.nuevo.aniosVidaUtil,
        valorResidual: l.nuevo.valorResidual,
      },
    }
  })
  return { sucursalId: v.sucursalId, items }
}
