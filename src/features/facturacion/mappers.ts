import type { CreateFacturaDto, ItemDocumentoDto } from './types'
import type { TipoImpuesto } from './calc/types'
import { calcularItemFactura01, calcularResumenFactura01 } from './calc/factura01'
import { numeroALetras } from './calc/numero-letras'
import { IDENTIFICACION_FACTURA_DEFAULT } from './catalogos'

export interface FormItem {
  productoId?: number
  bodegaId?: number
  codigo?: string
  descripcion: string
  cantidad: number
  precioUni: number
  montoDescuento?: number
  uniMedida: number
  tipoItem: number
  tipoImpuesto: TipoImpuesto
}

export interface FormPago {
  catFormaPagoId: number
  monto: number
}

export interface FacturaFormValues {
  sucursalId: number
  esConsumidorFinal: boolean
  receptorId?: number | null
  vendedorId?: number | null
  condicionOperacion: number
  items: FormItem[]
  pagos: FormPago[]
}

export function buildCreateFacturaDto(
  values: FacturaFormValues,
  ahora: { fecha: string; hora: string },
): CreateFacturaDto {
  const calculados = values.items.map((it) =>
    calcularItemFactura01({
      cantidad: it.cantidad,
      precioUni: it.precioUni,
      montoDescuento: it.montoDescuento,
      tipoImpuesto: it.tipoImpuesto,
    }),
  )
  const resumen = calcularResumenFactura01(calculados)

  const cuerpoDocumento: ItemDocumentoDto[] = values.items.map((it, idx) => ({
    numItem: idx + 1,
    tipoItem: it.tipoItem,
    cantidad: it.cantidad,
    codigo: it.codigo,
    uniMedida: it.uniMedida,
    descripcion: it.descripcion,
    precioUni: it.precioUni,
    montoDescuento: it.montoDescuento ?? 0,
    ventaGravada: calculados[idx].ventaGravada,
    ventaExenta: calculados[idx].ventaExenta,
    ventaNoSuj: calculados[idx].ventaNoSuj,
    ivaItem: calculados[idx].ivaItem,
    tributos: null,
    productoId: it.productoId,
    bodegaId: it.bodegaId,
    precioIncluyeIva: true,
  }))

  return {
    identificacion: {
      ...IDENTIFICACION_FACTURA_DEFAULT,
      fechaEmision: ahora.fecha,
      horaEmision: ahora.hora,
    },
    sucursalId: values.sucursalId,
    receptorId: values.esConsumidorFinal ? null : values.receptorId ?? null,
    receptor: null,
    vendedorId: values.vendedorId ?? null,
    cuerpoDocumento,
    resumen: {
      totalNoSuj: resumen.totalNoSuj,
      totalExenta: resumen.totalExenta,
      totalGravada: resumen.totalGravada,
      subTotal: resumen.subTotal,
      totalIva: resumen.totalIva,
      totalPagar: resumen.totalPagar,
      totalLetras: numeroALetras(resumen.totalPagar),
      condicionOperacion: values.condicionOperacion,
      pagos: values.pagos.map((p) => ({ catFormaPagoId: p.catFormaPagoId, monto: p.monto })),
    },
  }
}
