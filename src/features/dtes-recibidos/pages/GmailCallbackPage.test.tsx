// src/features/dtes-recibidos/pages/GmailCallbackPage.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { GmailCallbackPage } from './GmailCallbackPage'
import { useAuthStore } from '@/app/auth-store'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/dtes-recibidos/gmail/callback?code=abc&state=xyz']}>
        <Routes>
          <Route path="/dtes-recibidos/gmail/callback" element={<GmailCallbackPage />} />
          <Route path="/dtes-recibidos/configuracion" element={<div>Config</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('GmailCallbackPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: 'header.eyJleHAiOjk5OTk5OTk5OTl9.sig', status: 'authenticated', user: { userId: 1, nombreCompleto: 'Ana', email: 'a@x.com', rolId: 2, rolNombre: 'EmisorAdmin', emisorId: 5, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
  })

  it('intercambia el código y confirma la conexión', async () => {
    setup()
    expect(await screen.findByText(/cuenta@gmail.com/i)).toBeInTheDocument()
  })
})
