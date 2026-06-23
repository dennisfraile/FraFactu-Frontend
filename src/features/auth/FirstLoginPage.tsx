import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { Button, Card, FormField, Input, useToast } from '@/design-system'
import { firstLoginSchema, type FirstLoginValues } from './schemas'
import { authApi } from './api'
import { useAuthStore } from '@/app/auth-store'

export function FirstLoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<FirstLoginValues>({ resolver: zodResolver(firstLoginSchema) })
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const { show } = useToast()
  async function onSubmit(v: FirstLoginValues) {
    setBusy(true)
    try {
      const r = await authApi.changePasswordFirstLogin(v.newPassword, v.confirmPassword)
      setSession(r)
      navigate('/dashboard', { replace: true })
    } catch {
      show('No se pudo cambiar la contraseña', { tone: 'rojo' })
    } finally { setBusy(false) }
  }
  return (
    <div className="grid min-h-full place-items-center bg-canvas p-6 dark:bg-[#0f1c18]">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 font-display text-xl font-bold">Cambia tu contraseña</h1>
        <p className="mb-4 text-sm text-slate">Es tu primer ingreso: define una contraseña nueva para continuar.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField label="Nueva contraseña" htmlFor="np" error={errors.newPassword?.message}>
            <Input id="np" type="password" invalid={!!errors.newPassword} {...register('newPassword')} />
          </FormField>
          <FormField label="Confirmar contraseña" htmlFor="cp" error={errors.confirmPassword?.message}>
            <Input id="cp" type="password" invalid={!!errors.confirmPassword} {...register('confirmPassword')} />
          </FormField>
          <Button type="submit" loading={busy} className="w-full">Guardar y continuar</Button>
        </form>
      </Card>
    </div>
  )
}
