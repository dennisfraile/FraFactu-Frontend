import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { TotalesPanel } from './TotalesPanel'

describe('TotalesPanel', () => {
  it('muestra totales en vivo de los ítems', () => {
    render(<TotalesPanel items={[{ descripcion: 'A', cantidad: 2, precioUni: 56.5, uniMedida: 59, tipoItem: 1, tipoImpuesto: 1 }]} />)
    // Verify total is shown and matches the text in the number-to-words conversion
    const totalRow = screen.getByText('Total a pagar').parentElement
    expect(within(totalRow!).getByText('$113.00')).toBeInTheDocument()
    expect(screen.getByText(/CIENTO TRECE/i)).toBeInTheDocument()
  })
})
