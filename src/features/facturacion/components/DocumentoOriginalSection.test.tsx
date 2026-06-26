import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactElement } from 'react'
import { DocumentoOriginalSection } from './DocumentoOriginalSection'

function wrap(ui: ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('DocumentoOriginalSection', () => {
  it('NC: al elegir el CCF entrega documento relacionado, receptor e ítems precargados', async () => {
    const user = userEvent.setup()
    const onSeleccion = vi.fn()
    wrap(<DocumentoOriginalSection tipoDte="05" prefill={true} onSeleccion={onSeleccion} />)
    await user.type(screen.getByRole('combobox'), 'cliente')
    const opcion = await screen.findByText(/CCF-GUID-1|Cliente Uno|DTE-03/i)
    await user.click(opcion)
    await waitFor(() => expect(onSeleccion).toHaveBeenCalled())
    const arg = onSeleccion.mock.calls.at(-1)![0]
    expect(arg.documentoRelacionado).toEqual({ tipoDocumento: '03', tipoGeneracion: 1, numeroDocumento: 'CCF-GUID-1', fechaEmision: '2026-06-20' })
    expect(arg.receptor.id).toBe(7)
    expect(arg.items).toHaveLength(1)
    expect(arg.items[0].descripcion).toBe('Producto A')
  })
  it('ND: prefill=false entrega items vacíos', async () => {
    const user = userEvent.setup()
    const onSeleccion = vi.fn()
    wrap(<DocumentoOriginalSection tipoDte="06" prefill={false} onSeleccion={onSeleccion} />)
    await user.type(screen.getByRole('combobox'), 'cliente')
    await user.click(await screen.findByText(/CCF-GUID-1|Cliente Uno|DTE-03/i))
    await waitFor(() => expect(onSeleccion).toHaveBeenCalled())
    expect(onSeleccion.mock.calls.at(-1)![0].items).toHaveLength(0)
  })
})
