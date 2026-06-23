import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Correo no válido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})
export type LoginValues = z.infer<typeof loginSchema>

export const forgotSchema = z.object({
  email: z.string().email('Correo no válido'),
})
export type ForgotValues = z.infer<typeof forgotSchema>

export const resetSchema = z
  .object({
    newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
export type ResetValues = z.infer<typeof resetSchema>

export const firstLoginSchema = resetSchema
export type FirstLoginValues = ResetValues
