import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Card, FormField, Input, useToast } from '@/design-system'
import { resetSchema, type ResetValues } from './schemas'
import { authApi } from './api'

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const { register, handleSubmit, formState: { errors } } = useForm<ResetValues>({ resolver: zodResolver(resetSchema) })
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const { show } = useToast()
  async function onSubmit(v: ResetValues) {
    setBusy(true)
    try {
      await authApi.resetPassword(token, v.newPassword, v.confirmPassword)
      show('Contraseña restablecida. Inicia sesión.')
      navigate('/login', { replace: true })
    } catch {
      show('El enlace es inválido o expiró', { tone: 'rojo' })
    } finally { setBusy(false) }
  }
  return (
    <div className="grid min-h-full place-items-center bg-canvas p-6 dark:bg-canvas-dark">
      <Card className="w-full max-w-sm">
        <h1 className="mb-3 font-display text-xl font-bold">Nueva contraseña</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField label="Nueva contraseña" htmlFor="np" error={errors.newPassword?.message}>
            <Input id="np" type="password" invalid={!!errors.newPassword} {...register('newPassword')} />
          </FormField>
          <FormField label="Confirmar contraseña" htmlFor="cp" error={errors.confirmPassword?.message}>
            <Input id="cp" type="password" invalid={!!errors.confirmPassword} {...register('confirmPassword')} />
          </FormField>
          <Button type="submit" loading={busy} className="w-full">Restablecer</Button>
        </form>
      </Card>
    </div>
  )
}
