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
