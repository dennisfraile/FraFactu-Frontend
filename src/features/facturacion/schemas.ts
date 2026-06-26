import { z } from 'zod'
import { pagosCuadran } from './calc/factura01'
import { TIPO_ITEM } from './catalogos'
import { getStrategy } from './dte/registry'
import type { DteStrategy } from './dte/strategy'

const itemSchema = z.object({
  productoId: z.number().optional(),
  bodegaId: z.number().optional(),
  codigo: z.string().optional(),
  descripcion: z.string().min(1, 'Descripción requerida'),
  cantidad: z.number().positive('La cantidad debe ser mayor que 0'),
  precioUni: z.number().nonnegative('El precio no puede ser negativo'),
  montoDescuento: z.number().nonnegative().optional(),
  uniMedida: z.number().int(),
  tipoItem: z.number().int(),
  tipoImpuesto: z.union([z.literal(1), z.literal(2), z.literal(3)]),
})

const pagoSchema = z.object({
  catFormaPagoId: z.number().int(),
  monto: z.number().positive('El monto debe ser mayor que 0'),
})

export function buildFacturaSchema(strategy: DteStrategy) {
  return z
    .object({
      sucursalId: z.number().int().positive('Seleccione una sucursal'),
      cajaId: z.number().int().positive().nullable(),
      esConsumidorFinal: z.boolean(),
      receptorId: z.number().int().nullable().optional(),
      vendedorId: z.number().int().nullable().optional(),
      condicionOperacion: z.number().int(),
      esAgenteRetencion: z.boolean().optional(),
      documentoRelacionado: z
        .object({ tipoDocumento: z.string(), tipoGeneracion: z.number().int(), numeroDocumento: z.string().min(1), fechaEmision: z.string().min(1) })
        .nullable()
        .optional(),
      items: z.array(itemSchema).min(1, 'Agregue al menos un ítem'),
      pagos: z.array(pagoSchema).min(1, 'Agregue al menos una forma de pago'),
    })
    .superRefine((v, ctx) => {
      // Caja: obligatoria solo si el tipo la requiere (01/03).
      if (strategy.requiereCaja && !v.cajaId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['cajaId'], message: 'Seleccione una caja' })
      }
      // Receptor: según la política del tipo.
      if (strategy.receptorPolicy === 'opcional') {
        if (!v.esConsumidorFinal && !v.receptorId) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['receptorId'], message: 'Seleccione un receptor o marque Consumidor Final' })
        }
      } else if (!v.receptorId) {
        const msg = strategy.receptorPolicy === 'sujetoExcluido' ? 'Seleccione el sujeto excluido' : 'Seleccione el receptor (contribuyente)'
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['receptorId'], message: msg })
      }
      // Documento relacionado: obligatorio para NC (05) / ND (06).
      if (strategy.requiereDocumentoRelacionado && !v.documentoRelacionado) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['documentoRelacionado'], message: 'Seleccione el documento original (CCF) a referenciar' })
      }
      // Bodega: requerida en ítems Bien solo cuando el tipo descuenta stock (01/03).
      if (strategy.descuentaStock) {
        v.items.forEach((it, idx) => {
          if (it.tipoItem === TIPO_ITEM.BIEN && !it.bodegaId) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['items', idx, 'bodegaId'], message: 'Seleccione una bodega para el ítem' })
          }
        })
      }
      // Cuadre de pagos contra el total calculado por la estrategia.
      const calc = v.items.map((it) =>
        strategy.calcItem({ cantidad: it.cantidad, precioUni: it.precioUni, montoDescuento: it.montoDescuento, tipoImpuesto: it.tipoImpuesto }),
      )
      const { totalPagar } = strategy.calcResumen(calc, { esAgenteRetencion: v.esAgenteRetencion })
      if (!pagosCuadran(v.pagos.map((p) => p.monto), totalPagar)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['pagos'], message: `Los pagos deben sumar exactamente $${totalPagar.toFixed(2)}` })
      }
    })
}

export const facturaFormSchema = buildFacturaSchema(getStrategy('01'))
export type FacturaFormInput = z.infer<typeof facturaFormSchema>
