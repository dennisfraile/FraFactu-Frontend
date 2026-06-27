// src/features/dtes-recibidos/pages/GmailCallbackPage.tsx
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button, Spinner } from '@/design-system'
import { gmailApi } from '../gmail-api'

export function GmailCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const code = params.get('code') ?? ''
  const state = params.get('state') ?? ''

  // El intercambio ocurre como query (idempotente para la UI): se dispara al montar
  // porque enabled depende de los search params, sin useEffect+setState.
  const exchange = useQuery({
    queryKey: ['gmail-exchange', code, state],
    queryFn: () => gmailApi.exchangeCode(code, state),
    enabled: code !== '' && state !== '',
    retry: false,
  })

  return (
    <div className="mx-auto max-w-md space-y-4 p-6 text-center">
      <h1 className="text-xl font-semibold text-ink">Conectando Gmail…</h1>
      {exchange.isLoading && <Spinner />}
      {exchange.isError && <p className="rounded-md bg-rojo/10 px-3 py-2 text-sm text-rojo">No se pudo conectar Gmail. Intenta de nuevo desde la configuración.</p>}
      {exchange.isSuccess && <p className="rounded-md bg-sello/10 px-3 py-2 text-sm">Gmail conectado: <span className="font-medium">{exchange.data.email}</span></p>}
      {!code && <p className="text-sm text-slate">Falta el código de autorización.</p>}
      <Button onClick={() => navigate('/dtes-recibidos/configuracion')}>Volver a configuración</Button>
    </div>
  )
}
