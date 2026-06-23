import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from 'react-router-dom'
import { Button, Card, FormField, Input, useToast } from '@/design-system'
import { loginSchema, type LoginValues } from './schemas'
import { authApi } from './api'
import { GoogleButton } from './GoogleButton'
import { useAuthStore } from '@/app/auth-store'
import type { LoginResponse } from './types'

export function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const { show } = useToast()

  function enRespuesta(r: LoginResponse) {
    setSession(r)
    navigate(r.requiereCambioPwd ? '/first-login' : '/dashboard', { replace: true })
  }

  async function onSubmit(values: LoginValues) {
    setBusy(true)
    try {
      enRespuesta(await authApi.login(values.email, values.password))
    } catch {
      show('Email o contraseña incorrectos', { tone: 'rojo' })
    } finally { setBusy(false) }
  }

  async function onGoogle(accessToken: string) {
    setBusy(true)
    try { enRespuesta(await authApi.googleLogin(accessToken)) }
    catch { show('No se pudo iniciar con Google', { tone: 'rojo' }) }
    finally { setBusy(false) }
  }

  return (
    <div className="grid min-h-full place-items-center bg-canvas p-6 dark:bg-[#0f1c18]">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 font-display text-2xl font-bold tracking-tight">FraFactu</h1>
        <p className="mb-5 text-sm text-slate">Inicia sesión para continuar.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField label="Correo" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" invalid={!!errors.email} {...register('email')} />
          </FormField>
          <FormField label="Contraseña" htmlFor="password" error={errors.password?.message}>
            <Input id="password" type="password" autoComplete="current-password" invalid={!!errors.password} {...register('password')} />
          </FormField>
          <Button type="submit" loading={busy} className="w-full">Iniciar sesión</Button>
        </form>
        <div className="my-4 flex items-center gap-3 text-xs text-slate"><span className="h-px flex-1 bg-hairline" />o<span className="h-px flex-1 bg-hairline" /></div>
        <GoogleButton onToken={onGoogle} disabled={busy} />
        <div className="mt-4 text-center text-sm">
          <Link to="/forgot-password" className="text-sello hover:underline">¿Olvidaste tu contraseña?</Link>
        </div>
      </Card>
    </div>
  )
}
