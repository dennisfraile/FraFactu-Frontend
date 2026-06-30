import { z } from 'zod'
import type { CrearUsuarioDto, ActualizarUsuarioDto } from './types'

const sucursalesValidas = (d: { accesoTodasSucursales: boolean; sucursalIds: number[] }) =>
  d.accesoTodasSucursales || d.sucursalIds.length > 0

export const crearUsuarioSchema = z.object({
  nombreCompleto: z.string().trim().min(1, 'Nombre requerido'),
  email: z.string().trim().email('Email inválido'),
  rolId: z.number().int().positive('Seleccione un rol'),
  accesoTodasSucursales: z.boolean(),
  sucursalIds: z.array(z.number().int()),
  cajaIds: z.array(z.number().int()),
  modoPassword: z.enum(['correo', 'manual']),
  password: z.string().optional().default(''),
  confirmar: z.string().optional().default(''),
  requiereCambioPwd: z.boolean(),
})
  .refine(sucursalesValidas, { message: 'Seleccione al menos una sucursal', path: ['sucursalIds'] })
  .refine((d) => d.modoPassword !== 'manual' || (d.password ?? '').length >= 8, { message: 'Mínimo 8 caracteres', path: ['password'] })
  .refine((d) => d.modoPassword !== 'manual' || d.password === d.confirmar, { message: 'Las contraseñas no coinciden', path: ['confirmar'] })

export type CrearUsuarioForm = z.input<typeof crearUsuarioSchema>

export const actualizarUsuarioSchema = z.object({
  nombreCompleto: z.string().trim().min(1, 'Nombre requerido'),
  email: z.string().trim().email('Email inválido'),
  rolId: z.number().int().positive('Seleccione un rol'),
  activo: z.boolean(),
  accesoTodasSucursales: z.boolean(),
  sucursalIds: z.array(z.number().int()),
  cajaIds: z.array(z.number().int()),
  requiereCambioPwd: z.boolean(),
  resetPassword: z.boolean(),
  password: z.string().optional().default(''),
  confirmar: z.string().optional().default(''),
})
  .refine(sucursalesValidas, { message: 'Seleccione al menos una sucursal', path: ['sucursalIds'] })
  .refine((d) => !d.resetPassword || (d.password ?? '').length >= 8, { message: 'Mínimo 8 caracteres', path: ['password'] })
  .refine((d) => !d.resetPassword || d.password === d.confirmar, { message: 'Las contraseñas no coinciden', path: ['confirmar'] })

export type ActualizarUsuarioForm = z.input<typeof actualizarUsuarioSchema>

export function toCrearDto(f: CrearUsuarioForm): CrearUsuarioDto {
  return {
    nombreCompleto: f.nombreCompleto.trim(),
    email: f.email.trim(),
    rolId: f.rolId,
    accesoTodasSucursales: f.accesoTodasSucursales,
    sucursalIds: f.accesoTodasSucursales ? [] : f.sucursalIds,
    cajaIds: f.cajaIds,
    requiereCambioPwd: f.requiereCambioPwd,
    password: f.modoPassword === 'manual' ? f.password : undefined,
  }
}

export function toActualizarDto(f: ActualizarUsuarioForm): ActualizarUsuarioDto {
  return {
    nombreCompleto: f.nombreCompleto.trim(),
    email: f.email.trim(),
    rolId: f.rolId,
    activo: f.activo,
    accesoTodasSucursales: f.accesoTodasSucursales,
    sucursalIds: f.accesoTodasSucursales ? [] : f.sucursalIds,
    cajaIds: f.cajaIds,
    requiereCambioPwd: f.requiereCambioPwd,
    password: f.resetPassword ? f.password : undefined,
  }
}
