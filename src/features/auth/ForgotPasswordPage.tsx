import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { Button, Card, FormField, Input } from '@/design-system'
import { forgotSchema, type ForgotValues } from './schemas'
import { authApi } from './api'

export function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema) })
  const [enviado, setEnviado] = useState(false)
  const [busy, setBusy] = useState(false)
  async function onSubmit(v: ForgotValues) {
    setBusy(true)
    try { await authApi.forgotPassword(v.email); setEnviado(true) } finally { setBusy(false) }
  }
  return (
    <div className="grid min-h-full place-items-center bg-canvas p-6 dark:bg-[#0f1c18]">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 font-display text-xl font-bold">Recuperar contraseña</h1>
        {enviado ? (
          <p className="text-sm text-slate">Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField label="Correo" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" invalid={!!errors.email} {...register('email')} />
            </FormField>
            <Button type="submit" loading={busy} className="w-full">Enviar enlace</Button>
          </form>
        )}
        <div className="mt-4 text-center text-sm"><Link to="/login" className="text-sello hover:underline">Volver a iniciar sesión</Link></div>
      </Card>
    </div>
  )
}
