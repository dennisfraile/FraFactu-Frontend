import { calcularItemFactura01, calcularResumenFactura01 } from '../calc/factura01'
import { numeroALetras } from '../calc/numero-letras'
import type { ItemCalculado, ResumenNumerico } from '../calc/types'
import type { ItemDocumentoDto, ResumenDto } from '../types'
import type { DteStrategy, FormItem, FacturaFormValues } from './strategy'

// La estrategia '01' delega en la lógica probada de calc/factura01.ts (paridad F5.1).
export const facturaStrategy: DteStrategy = {
  tipoDte: '01',
  version: 2,
  etiqueta: 'Factura Electrónica',
  etiquetaCorta: '01',
  precioIncluyeIva: true,
  requiereCaja: true,
  descuentaStock: true,
  receptorPolicy: 'opcional',
  usaAgenteRetencion: false,
  requiereDocumentoRelacionado: false,
  prefillDesdeOriginal: false,
  calcItem: calcularItemFactura01,
  calcResumen: (items: ItemCalculado[]): ResumenNumerico => calcularResumenFactura01(items),
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
      tributos: null,
      productoId: item.productoId,
      bodegaId: item.bodegaId,
      precioIncluyeIva: true,
    }
  },
  buildResumenDto(resumen: ResumenNumerico, values: FacturaFormValues): ResumenDto {
    return {
      totalNoSuj: resumen.totalNoSuj,
      totalExenta: resumen.totalExenta,
      totalGravada: resumen.totalGravada,
      subTotal: resumen.subTotal,
      totalIva: resumen.totalIva,
      totalPagar: resumen.totalPagar,
      totalLetras: numeroALetras(resumen.totalPagar),
      condicionOperacion: values.condicionOperacion,
      pagos: values.pagos.map((p) => ({ catFormaPagoId: p.catFormaPagoId, monto: p.monto })),
    }
  },
}
