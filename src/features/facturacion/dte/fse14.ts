import { round } from '../calc/round'
import { numeroALetras } from '../calc/numero-letras'
import type { ItemInput, ItemCalculado, ResumenNumerico } from '../calc/types'
import type { ItemDocumentoDto, ResumenDto } from '../types'
import type { DteStrategy, FormItem, FacturaFormValues, ResumenOpts } from './strategy'

// FSE (14): el emisor COMPRA a un sujeto excluido. Sin IVA; el detalle lleva `compra`.
export function calcItemFse14(input: ItemInput): ItemCalculado {
  const montoDescuento = input.montoDescuento ?? 0
  const compra = round(input.precioUni * input.cantidad - montoDescuento, 2)
  return { ventaGravada: 0, ventaExenta: 0, ventaNoSuj: 0, ivaItem: 0, compra, montoDescuento }
}

export function calcResumenFse14(items: ItemCalculado[], opts?: ResumenOpts): ResumenNumerico {
  // totalCompras = Σ(compra + descuento); descu = Σ descuento; subTotal = Σ compra.
  const totalCompras = round(items.reduce((s, i) => s + (i.compra ?? 0) + (i.montoDescuento ?? 0), 0), 2)
  const descu = round(items.reduce((s, i) => s + (i.montoDescuento ?? 0), 0), 2)
  const subTotal = round(totalCompras - descu, 2)
  const reteRenta = subTotal > 100 ? round(subTotal * 0.1, 2) : 0
  const ivaRete1 = opts?.esAgenteRetencion ? round(subTotal * 0.01, 2) : 0
  const totalPagar = round(subTotal - ivaRete1 - reteRenta, 2)
  return { totalGravada: 0, totalExenta: 0, totalNoSuj: 0, totalIva: 0, subTotal, totalPagar, totalCompras, descu, reteRenta, ivaRete1 }
}

export const fseStrategy: DteStrategy = {
  tipoDte: '14',
  version: 2,
  etiqueta: 'Factura de Sujeto Excluido',
  etiquetaCorta: 'FSE',
  precioIncluyeIva: false,
  requiereCaja: false,
  descuentaStock: false,
  receptorPolicy: 'sujetoExcluido',
  usaAgenteRetencion: true,
  calcItem: calcItemFse14,
  calcResumen: calcResumenFse14,
  buildItemDto(item: FormItem, calc: ItemCalculado, numItem: number): ItemDocumentoDto {
    return {
      numItem,
      tipoItem: item.tipoItem,
      cantidad: item.cantidad,
      codigo: item.codigo,
      uniMedida: item.uniMedida,
      descripcion: item.descripcion,
      precioUni: item.precioUni,
      montoDescuento: item.montoDescuento ?? 0,
      ventaGravada: 0,
      ventaExenta: 0,
      ventaNoSuj: 0,
      ivaItem: 0,
      compra: calc.compra ?? 0,
      tributos: null,
      productoId: item.productoId,
      // FSE no descuenta stock: no se envía bodegaId.
      precioIncluyeIva: false,
    }
  },
  buildResumenDto(resumen: ResumenNumerico, values: FacturaFormValues): ResumenDto {
    return {
      totalNoSuj: 0,
      totalExenta: 0,
      totalGravada: 0,
      subTotal: resumen.subTotal,
      totalIva: 0,
      totalCompras: resumen.totalCompras,
      descu: resumen.descu,
      ivaRete1: resumen.ivaRete1,
      reteRenta: resumen.reteRenta,
      totalPagar: resumen.totalPagar,
      totalLetras: numeroALetras(resumen.totalPagar),
      condicionOperacion: values.condicionOperacion,
      pagos: values.pagos.map((p) => ({ catFormaPagoId: p.catFormaPagoId, monto: p.monto })),
    }
  },
}
