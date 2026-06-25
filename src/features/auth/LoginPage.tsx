import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from 'react-router-dom'
import { Button, Card, FormField, Input, useToast } from '@/design-system'
import { loginSchema, type LoginValues } from './schemas'
import { authApi } from './api'
import { GoogleButton } from './GoogleButton'
import { useAuthStore } from '@/app/auth-store'
import { env } from '@/lib/config/env'
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
    <div className="relative grid min-h-full place-items-center overflow-hidden bg-canvas p-6 dark:bg-canvas-dark">
      {/* Atmósfera: resplandor sello + lacre oro, muy tenue. */}
      <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-sello/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-oro/10 blur-3xl" />
      <Card className="relative w-full max-w-sm p-7! shadow-lift">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-sello font-display text-xl font-bold text-white shadow-soft ring-1 ring-oro/40">F</span>
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">FraFactu</h1>
          <p className="text-sm text-slate">Facturación electrónica</p>
          <span className="mt-3 h-0.5 w-10 rounded-full bg-oro" />
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField label="Correo" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" invalid={!!errors.email} {...register('email')} />
          </FormField>
          <FormField label="Contraseña" htmlFor="password" error={errors.password?.message}>
            <Input id="password" type="password" autoComplete="current-password" invalid={!!errors.password} {...register('password')} />
          </FormField>
          <Button type="submit" loading={busy} className="w-full">Iniciar sesión</Button>
        </form>
        {/* Google es opcional: solo se ofrece si hay un client id configurado
            (useGoogleLogin con client id vacío rompe en runtime). */}
        {env.googleClientId && (
          <>
            <div className="my-4 flex items-center gap-3 text-xs text-slate"><span className="h-px flex-1 bg-hairline" />o<span className="h-px flex-1 bg-hairline" /></div>
            <GoogleButton onToken={onGoogle} disabled={busy} />
          </>
        )}
        <div className="mt-4 text-center text-sm">
          <Link to="/forgot-password" className="text-sello hover:underline">¿Olvidaste tu contraseña?</Link>
        </div>
      </Card>
    </div>
  )
}
