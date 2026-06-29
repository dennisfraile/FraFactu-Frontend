import { z } from 'zod'
import { MOTIVOS_AJUSTE } from './types'

export const productoSchema = z.object({
  codigo: z.string().min(1, 'El código es obligatorio'),
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  descripcion: z.string().optional().nullable(),
  precioVenta: z.number().min(0, 'El precio no puede ser negativo'),
  catUnidadMedidaId: z.number().int().positive('Seleccione la unidad de medida'),
  catTipoItemId: z.number().int().positive('Seleccione el tipo de ítem'),
  codigoBarras: z.string().optional().nullable(),
  categoriaId: z.number().int().positive().optional().nullable(),
  marcaId: z.number().int().positive().optional().nullable(),
  precioCosto: z.number().min(0).optional().nullable(),
  tipoImpuesto: z.number().int(),
  porcentajeIVA: z.number().min(0).optional().nullable(),
  precioIncluyeIva: z.boolean(),
  costoIncluyeIva: z.boolean(),
  stockMinimo: z.number().min(0).optional().nullable(),
  stockMaximo: z.number().min(0).optional().nullable(),
  puntoReorden: z.number().min(0).optional().nullable(),
  permiteVentaSinStock: z.boolean().optional().nullable(),
  tipoInventario: z.number().int(),
  fechaAdquisicion: z.string().optional().nullable(),
  aniosVidaUtil: z.number().int().min(0).optional().nullable(),
  valorActual: z.number().min(0).optional().nullable(),
  valorResidual: z.number().min(0).optional().nullable(),
  accesoTodasSucursales: z.boolean(),
  sucursalIds: z.array(z.number().int()).optional().nullable(),
})

export const categoriaSchema = z.object({
  codigo: z.string().min(1, 'El código es obligatorio'),
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  descripcion: z.string().optional().nullable(),
  categoriaPadreId: z.number().int().positive().optional().nullable(),
})

export const marcaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  descripcion: z.string().optional().nullable(),
})

export const ajusteSchema = z.object({
  productoId: z.number().int().positive('Seleccione un producto'),
  bodegaId: z.number().int().positive('Seleccione una bodega'),
  cantidad: z.number().refine((n) => n !== 0, 'La cantidad no puede ser 0'),
  motivo: z.enum(MOTIVOS_AJUSTE),
  observaciones: z.string().min(10, 'Las observaciones deben tener al menos 10 caracteres').max(1000),
})

export const trasladoSchema = z.object({
  productoId: z.number().int().positive('Seleccione un producto'),
  bodegaOrigenId: z.number().int().positive('Seleccione la bodega origen'),
  bodegaDestinoId: z.number().int().positive('Seleccione la bodega destino'),
  cantidad: z.number().positive('La cantidad debe ser mayor a 0'),
  observaciones: z.string().optional().nullable(),
}).refine((v) => v.bodegaOrigenId !== v.bodegaDestinoId, { message: 'Origen y destino deben ser distintos', path: ['bodegaDestinoId'] })

export type Producto = z.infer<typeof productoSchema>
export type Categoria = z.infer<typeof categoriaSchema>
export type Marca = z.infer<typeof marcaSchema>
export type Ajuste = z.infer<typeof ajusteSchema>
export type Traslado = z.infer<typeof trasladoSchema>
