import { z } from 'zod'

// Email opcional: acepta '' (vacío) o un email válido.
const emailOpcional = z.union([z.literal(''), z.string().email('Correo inválido')]).optional()

export const proveedorSchema = z.object({
  nit: z.string().regex(/^\d{14}$/, 'El NIT debe tener exactamente 14 dígitos'),
  nombre: z.string().min(1, 'El nombre es obligatorio').max(300),
  nombreComercial: z.string().max(300).optional(),
  direccion: z.string().max(500).optional(),
  telefono: z.string().max(50).optional(),
  email: emailOpcional,
  contacto: z.string().max(200).optional(),
  sitioWeb: z.string().max(300).optional(),
  notas: z.string().max(1000).optional(),
})

export type ProveedorFormInput = z.infer<typeof proveedorSchema>

const productoLineaSchema = z.object({
  productoId: z.number().int().positive('Seleccione un producto'),
  descripcion: z.string(),
  bodegaId: z.number().int().positive().nullable(),
  cantidad: z.number().positive('La cantidad debe ser mayor que 0'),
  costoUnitario: z.number().positive('El costo debe ser mayor que 0'),
  aplicaIva: z.boolean(),
  ivaManual: z.number().nonnegative().optional(),
  esParaInventario: z.boolean(),
})

const gastoLineaSchema = z.object({
  descripcion: z.string().min(1, 'Descripción del gasto requerida').max(500),
  monto: z.number().positive('El monto debe ser mayor que 0'),
  catTipoGastoId: z.number().int().nullable(),
  centroCosto: z.string().max(100),
  cuentaContable: z.string().max(50),
})

export const compraSchema = z
  .object({
    proveedorId: z.number().int().positive('Seleccione un proveedor'),
    sucursalId: z.number().int().positive('Seleccione una sucursal'),
    numeroFactura: z.string().min(1, 'El número de factura es obligatorio').max(100),
    fechaEmision: z.string().min(1, 'La fecha de emisión es obligatoria'),
    observaciones: z.string(),
    productos: z.array(productoLineaSchema),
    gastos: z.array(gastoLineaSchema),
  })
  .superRefine((v, ctx) => {
    if (v.productos.length === 0 && v.gastos.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['productos'], message: 'Agregue al menos una línea (producto o gasto)' })
    }
    v.productos.forEach((p, idx) => {
      if (p.esParaInventario && !p.bodegaId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['productos', idx, 'bodegaId'], message: 'Seleccione una bodega para el producto de inventario' })
      }
    })
  })

export type CompraFormInput = z.infer<typeof compraSchema>
