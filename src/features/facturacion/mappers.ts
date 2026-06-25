import type { CreateFacturaDto, ItemDocumentoDto, ReceptorDteDto } from './types'
import type { TipoImpuesto } from './calc/types'
import { calcularItemFactura01, calcularResumenFactura01 } from './calc/factura01'
import { numeroALetras } from './calc/numero-letras'
import {
  IDENTIFICACION_FACTURA_DEFAULT,
  NUMERO_CONTROL_PLACEHOLDER,
  CODIGO_GENERACION_PLACEHOLDER,
} from './catalogos'

// Nombre del receptor genérico para ventas a Consumidor Final (sin receptor registrado).
const RECEPTOR_CONSUMIDOR_FINAL: ReceptorDteDto = { nombre: 'Consumidor Final' }

export interface FormItem {
  productoId?: number
  bodegaId?: number // Id de bodega; requerido para ítems de tipo Bien (físico).
  codigo?: string
  descripcion: string
  cantidad: number
  precioUni: number
  montoDescuento?: number
  uniMedida: number // Id de catálogo cat_uni_medida (NO el código MH).
  tipoItem: number
  tipoImpuesto: TipoImpuesto
}

export interface FormPago {
  catFormaPagoId: number
  monto: number
}

export interface FacturaFormValues {
  sucursalId: number
  cajaId: number | null // Caja (POS); obligatoria para emitir Factura 01.
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

  // Consumidor Final → receptor inline (el backend rechaza receptorId y receptor ambos nulos).
  // Receptor registrado → receptorId (el backend exige receptorId XOR receptor, no ambos).
  // El schema garantiza receptorId presente cuando no es Consumidor Final.
  const esConsumidorFinal = values.esConsumidorFinal

  return {
    identificacion: {
      ...IDENTIFICACION_FACTURA_DEFAULT,
      numeroControl: NUMERO_CONTROL_PLACEHOLDER,
      codigoGeneracion: CODIGO_GENERACION_PLACEHOLDER,
      fechaEmision: ahora.fecha,
      horaEmision: ahora.hora,
    },
    cajaId: values.cajaId,
    sucursalId: values.sucursalId,
    receptorId: esConsumidorFinal ? null : values.receptorId ?? null,
    receptor: esConsumidorFinal ? RECEPTOR_CONSUMIDOR_FINAL : null,
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
