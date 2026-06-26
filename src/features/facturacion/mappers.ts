import type { CreateFacturaDto, ReceptorDteDto, TipoDte } from './types'
import { getStrategy } from './dte/registry'
import { CODIGO_GENERACION_PLACEHOLDER } from './catalogos'
import type { FacturaFormValues } from './dte/strategy'

// Re-export para compatibilidad con los componentes que importan estos tipos desde mappers.
export type { FormItem, FormPago, FacturaFormValues } from './dte/strategy'

// Nombre del receptor genérico para ventas a Consumidor Final (sin receptor registrado).
const RECEPTOR_CONSUMIDOR_FINAL: ReceptorDteDto = { nombre: 'Consumidor Final' }

export function buildCreateFacturaDto(
  values: FacturaFormValues,
  ahora: { fecha: string; hora: string },
  tipoDte: TipoDte = '01',
): CreateFacturaDto {
  const strategy = getStrategy(tipoDte)
  const opts = { esAgenteRetencion: values.esAgenteRetencion }

  const calculados = values.items.map((it) =>
    strategy.calcItem({
      cantidad: it.cantidad,
      precioUni: it.precioUni,
      montoDescuento: it.montoDescuento,
      tipoImpuesto: it.tipoImpuesto,
    }),
  )
  const resumenNum = strategy.calcResumen(calculados, opts)
  const cuerpoDocumento = values.items.map((it, idx) => strategy.buildItemDto(it, calculados[idx], idx + 1))

  // Consumidor Final solo aplica a tipos con receptor opcional (01). En CCF/FSE el receptor
  // (por receptorId) es obligatorio y se manda como receptorId XOR receptor inline.
  const esConsumidorFinal = strategy.receptorPolicy === 'opcional' && values.esConsumidorFinal

  // Placeholder derivado del tipoDte para que cumpla la regex del backend:
  // DTE-{tipoDte}-(M|B|S|P)###P###-{15 dígitos}
  const numeroControlPlaceholder = `DTE-${strategy.tipoDte}-M001P001-000000000000000`

  return {
    identificacion: {
      version: strategy.version,
      tipoDte: strategy.tipoDte,
      numeroControl: numeroControlPlaceholder,
      codigoGeneracion: CODIGO_GENERACION_PLACEHOLDER,
      tipoModelo: 1,
      tipoOperacion: 1,
      crearEventoAutomatico: false,
      tipoMoneda: 'USD',
      fechaEmision: ahora.fecha,
      horaEmision: ahora.hora,
    },
    cajaId: strategy.requiereCaja ? values.cajaId : null,
    sucursalId: values.sucursalId,
    receptorId: esConsumidorFinal ? null : values.receptorId ?? null,
    receptor: esConsumidorFinal ? RECEPTOR_CONSUMIDOR_FINAL : null,
    vendedorId: values.vendedorId ?? null,
    cuerpoDocumento,
    resumen: strategy.buildResumenDto(resumenNum, values),
    documentosRelacionados:
      strategy.requiereDocumentoRelacionado && values.documentoRelacionado
        ? [values.documentoRelacionado]
        : undefined,
  }
}
