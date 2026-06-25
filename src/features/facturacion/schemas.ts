import { z } from 'zod'
import { calcularItemFactura01, calcularResumenFactura01, pagosCuadran } from './calc/factura01'
import { TIPO_ITEM } from './catalogos'

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

export const facturaFormSchema = z
  .object({
    sucursalId: z.number().int().positive('Seleccione una sucursal'),
    cajaId: z.number().int().positive('Seleccione una caja'),
    esConsumidorFinal: z.boolean(),
    receptorId: z.number().int().nullable().optional(),
    vendedorId: z.number().int().nullable().optional(),
    condicionOperacion: z.number().int(),
    items: z.array(itemSchema).min(1, 'Agregue al menos un ítem'),
    pagos: z.array(pagoSchema).min(1, 'Agregue al menos una forma de pago'),
  })
  .superRefine((v, ctx) => {
    if (!v.esConsumidorFinal && !v.receptorId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['receptorId'], message: 'Seleccione un receptor o marque Consumidor Final' })
    }
    // Los ítems de tipo Bien (físico) requieren una bodega para descargar inventario.
    v.items.forEach((it, idx) => {
      if (it.tipoItem === TIPO_ITEM.BIEN && !it.bodegaId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['items', idx, 'bodegaId'], message: 'Seleccione una bodega para el ítem' })
      }
    })
    const calc = v.items.map((it) =>
      calcularItemFactura01({ cantidad: it.cantidad, precioUni: it.precioUni, montoDescuento: it.montoDescuento, tipoImpuesto: it.tipoImpuesto }),
    )
    const { totalPagar } = calcularResumenFactura01(calc)
    if (!pagosCuadran(v.pagos.map((p) => p.monto), totalPagar)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['pagos'], message: `Los pagos deben sumar exactamente $${totalPagar.toFixed(2)}` })
    }
  })

export type FacturaFormInput = z.infer<typeof facturaFormSchema>
