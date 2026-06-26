import { numeroALetras } from '../calc/numero-letras'
import { calcItemIvaNeto, calcResumenIvaNeto } from '../calc/iva-neto'
import type { ItemCalculado, ResumenNumerico } from '../calc/types'
import type { ItemDocumentoDto, ResumenDto } from '../types'
import type { DteStrategy, FormItem, FacturaFormValues } from './strategy'

// CCF (03): el precio unitario es NETO (sin IVA). El IVA se agrega: ivaItem = base × 0.13.
export const calcItemCcf03 = calcItemIvaNeto
export const calcResumenCcf03 = calcResumenIvaNeto

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
