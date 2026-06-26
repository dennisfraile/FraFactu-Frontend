import { round } from '../calc/round'
import { numeroALetras } from '../calc/numero-letras'
import type { ItemInput, ItemCalculado, ResumenNumerico } from '../calc/types'
import type { ItemDocumentoDto, ResumenDto } from '../types'
import type { DteStrategy, FormItem, FacturaFormValues } from './strategy'

const TASA_IVA = 0.13

// CCF (03): el precio unitario es NETO (sin IVA). El IVA se agrega: ivaItem = base × 0.13.
export function calcItemCcf03(input: ItemInput): ItemCalculado {
  const base = round(input.precioUni * input.cantidad - (input.montoDescuento ?? 0), 2)
  const r: ItemCalculado = { ventaGravada: 0, ventaExenta: 0, ventaNoSuj: 0, ivaItem: 0 }
  if (input.tipoImpuesto === 1) {
    r.ventaGravada = base
    r.ivaItem = round(base * TASA_IVA, 2)
  } else if (input.tipoImpuesto === 2) {
    r.ventaExenta = base
  } else {
    r.ventaNoSuj = base
  }
  return r
}

export function calcResumenCcf03(items: ItemCalculado[]): ResumenNumerico {
  const totalGravada = round(items.reduce((s, i) => s + i.ventaGravada, 0), 2)
  const totalExenta = round(items.reduce((s, i) => s + i.ventaExenta, 0), 2)
  const totalNoSuj = round(items.reduce((s, i) => s + i.ventaNoSuj, 0), 2)
  const totalIva = round(items.reduce((s, i) => s + i.ivaItem, 0), 2)
  const subTotal = round(totalGravada + totalExenta + totalNoSuj, 2)
  const montoTotalOperacion = round(subTotal + totalIva, 2)
  // reteRenta=0 para CCF (MH solo aplica retención de renta a FSE).
  const totalPagar = montoTotalOperacion
  return { totalGravada, totalExenta, totalNoSuj, totalIva, subTotal, totalPagar, montoTotalOperacion, reteRenta: 0 }
}

export const ccfStrategy: DteStrategy = {
  tipoDte: '03',
  version: 4,
  etiqueta: 'Comprobante de Crédito Fiscal',
  etiquetaCorta: 'CCF',
  precioIncluyeIva: false,
  requiereCaja: true,
  descuentaStock: true,
  receptorPolicy: 'contribuyente',
  usaAgenteRetencion: false,
  calcItem: calcItemCcf03,
  calcResumen: (items: ItemCalculado[]): ResumenNumerico => calcResumenCcf03(items),
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
      ventaGravada: calc.ventaGravada,
      ventaExenta: calc.ventaExenta,
      ventaNoSuj: calc.ventaNoSuj,
      ivaItem: calc.ivaItem,
      tributos: calc.ventaGravada > 0 ? ['20'] : null,
      productoId: item.productoId,
      bodegaId: item.bodegaId,
      precioIncluyeIva: false,
    }
  },
  buildResumenDto(resumen: ResumenNumerico, values: FacturaFormValues): ResumenDto {
    return {
      totalNoSuj: resumen.totalNoSuj,
      totalExenta: resumen.totalExenta,
      totalGravada: resumen.totalGravada,
      subTotal: resumen.subTotal,
      totalIva: resumen.totalIva,
      montoTotalOperacion: resumen.montoTotalOperacion,
      tributos: resumen.totalIva > 0
        ? [{ codigo: '20', descripcion: 'Impuesto al Valor Agregado 13%', valor: resumen.totalIva }]
        : undefined,
      reteRenta: 0,
      totalPagar: resumen.totalPagar,
      totalLetras: numeroALetras(resumen.totalPagar),
      condicionOperacion: values.condicionOperacion,
      pagos: values.pagos.map((p) => ({ catFormaPagoId: p.catFormaPagoId, monto: p.monto })),
    }
  },
}
