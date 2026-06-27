import { z } from 'zod'

export const MESES_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/

const lineaSchema = z.object({
  accion: z.enum(['PRODUCTO_EXISTENTE', 'PRODUCTO_NUEVO', 'GASTO']),
  productoId: z.number().int().nullable(),
  cantidad: z.number(),
  bodegaId: z.number().int().nullable(),
  costoUnitario: z.number(),
  catTipoGastoId: z.number().int().nullable(),
  nuevo: z.object({
    codigo: z.string(),
    nombre: z.string(),
    catTipoItemId: z.number().int().nullable(),
    catUnidadMedidaId: z.number().int().nullable(),
    categoriaId: z.number().int().nullable(),
    tipoInventario: z.number().int(),
    aniosVidaUtil: z.number().int().nullable(),
    valorResidual: z.number().nullable(),
  }),
})

export const mapeoSchema = z
  .object({
    sucursalId: z.number().int().positive('Seleccione una sucursal'),
    lineas: z.array(lineaSchema).min(1, 'El DTE no tiene líneas para mapear'),
  })
  .superRefine((v, ctx) => {
    v.lineas.forEach((l, i) => {
      if (l.accion === 'PRODUCTO_EXISTENTE') {
        if (!l.productoId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['lineas', i, 'productoId'], message: 'Seleccione un producto' })
        if (!(l.cantidad > 0)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['lineas', i, 'cantidad'], message: 'La cantidad debe ser mayor que 0' })
        if (!l.bodegaId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['lineas', i, 'bodegaId'], message: 'Seleccione una bodega' })
        if (l.costoUnitario < 0) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['lineas', i, 'costoUnitario'], message: 'Costo inválido' })
      } else if (l.accion === 'PRODUCTO_NUEVO') {
        if (!l.nuevo.codigo.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['lineas', i, 'nuevo', 'codigo'], message: 'Código requerido' })
        if (!l.nuevo.nombre.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['lineas', i, 'nuevo', 'nombre'], message: 'Nombre requerido' })
        if (!l.nuevo.catTipoItemId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['lineas', i, 'nuevo', 'catTipoItemId'], message: 'Seleccione el tipo de ítem' })
        if (!l.nuevo.catUnidadMedidaId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['lineas', i, 'nuevo', 'catUnidadMedidaId'], message: 'Seleccione la unidad de medida' })
        if (!(l.cantidad > 0)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['lineas', i, 'cantidad'], message: 'La cantidad debe ser mayor que 0' })
        if (!l.bodegaId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['lineas', i, 'bodegaId'], message: 'Seleccione una bodega' })
        if (l.costoUnitario < 0) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['lineas', i, 'costoUnitario'], message: 'Costo inválido' })
      }
    })
  })

export type MapeoInput = z.infer<typeof mapeoSchema>

export const leerCorreoSchema = z
  .object({ mesInicio: z.string(), mesFin: z.string() })
  .superRefine((v, ctx) => {
    const aDef = v.mesInicio.trim() !== ''
    const bDef = v.mesFin.trim() !== ''
    if (aDef !== bDef) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['mesInicio'], message: 'Indique ambos meses o ninguno' })
      return
    }
    if (!aDef) return
    if (!MESES_REGEX.test(v.mesInicio)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['mesInicio'], message: 'Formato AAAA-MM' })
    if (!MESES_REGEX.test(v.mesFin)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['mesFin'], message: 'Formato AAAA-MM' })
    if (MESES_REGEX.test(v.mesInicio) && MESES_REGEX.test(v.mesFin) && v.mesFin < v.mesInicio)
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['mesFin'], message: 'El mes fin debe ser mayor o igual al mes inicio' })
  })

export type LeerCorreoInput = z.infer<typeof leerCorreoSchema>
