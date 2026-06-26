import { numeroALetras } from '../calc/numero-letras'
import { calcItemIvaNeto, calcResumenIvaNeto } from '../calc/iva-neto'
import type { ItemCalculado, ResumenNumerico } from '../calc/types'
import type { ItemDocumentoDto, ResumenDto } from '../types'
import type { DteStrategy, FormItem, FacturaFormValues } from './strategy'

// ND (06): ajuste al alza de un CCF (cargos nuevos). Mismo cálculo IVA-neto que el 03.
export const ndStrategy: DteStrategy = {
  tipoDte: '06',
  version: 4,
  etiqueta: 'Nota de Débito',
  etiquetaCorta: 'ND',
  precioIncluyeIva: false,
  requiereCaja: false,
  descuentaStock: false,
  receptorPolicy: 'contribuyente',
  usaAgenteRetencion: false,
  requiereDocumentoRelacionado: true,
  prefillDesdeOriginal: false,
  calcItem: calcItemIvaNeto,
  calcResumen: (items: ItemCalculado[]): ResumenNumerico => calcResumenIvaNeto(items),
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
      reteRenta: 0,
      tributos: resumen.totalIva > 0 ? [{ codigo: '20', descripcion: 'Impuesto al Valor Agregado 13%', valor: resumen.totalIva }] : undefined,
      totalPagar: resumen.totalPagar,
      totalLetras: numeroALetras(resumen.totalPagar),
      condicionOperacion: values.condicionOperacion,
      pagos: values.pagos.map((p) => ({ catFormaPagoId: p.catFormaPagoId, monto: p.monto })),
    }
  },
}
