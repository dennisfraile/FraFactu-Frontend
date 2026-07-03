// src/features/dtes-recibidos/components/MapeoLineasTable.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MapeoLineasTable } from './MapeoLineasTable'
import { lineaDesdeParsed, type MapeoLineaForm } from '../mappers'
import type { DteLineaParsed } from '../parse'
import { authAs } from '@/test/auth'

const parsed: DteLineaParsed = {
  numItem: 1, codigo: 'P-1', descripcion: 'Papel', cantidad: 50, precioUnitario: 4.5,
  montoDescuento: 0, ventaGravada: 225, ventaExenta: 0, ventaNoSujeta: 0, unidadMedida: 59,
  montoNeto: 225, montoConIva: 254.25,
}

function renderTabla(lineas: MapeoLineaForm[], onLineas = vi.fn()) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={qc}>
      <MapeoLineasTable lineas={lineas} onLineas={onLineas} sucursalId={2} totalDte={254.25} ivaDte={29.25} subTotalDte={225} />
    </QueryClientProvider>,
  )
  return onLineas
}

describe('MapeoLineasTable', () => {
  beforeEach(() => {
    authAs('EmisorAdmin', { rolId: 2, emisorId: 5, accesoTodasSucursales: true })
  })

  it('muestra el cuadre y la línea sembrada como gasto', () => {
    renderTabla([lineaDesdeParsed(parsed)])
    expect(screen.getByText('Papel')).toBeInTheDocument()
    expect(screen.getByText(/cuadra/i)).toBeInTheDocument()
  })

  it('al cambiar la acción a Gasto/Existente notifica onLineas', async () => {
    const user = userEvent.setup()
    const onLineas = renderTabla([lineaDesdeParsed(parsed)])
    await user.click(screen.getByRole('button', { name: /^existente$/i }))
    expect(onLineas).toHaveBeenCalled()
  })
})
