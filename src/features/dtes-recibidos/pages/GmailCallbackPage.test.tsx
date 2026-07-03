// src/features/dtes-recibidos/pages/GmailCallbackPage.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { GmailCallbackPage } from './GmailCallbackPage'
import { authAs } from '@/test/auth'

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
    authAs('EmisorAdmin', { rolId: 2, emisorId: 5, accesoTodasSucursales: true })
  })

  it('intercambia el código y confirma la conexión', async () => {
    setup()
    expect(await screen.findByText(/cuenta@gmail.com/i)).toBeInTheDocument()
  })
})
