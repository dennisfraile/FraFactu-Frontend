import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReporteDescargaButtons } from './ReporteDescargaButtons'

describe('ReporteDescargaButtons', () => {
  it('invoca onDescargar con el formato correcto', () => {
    const onDescargar = vi.fn()
    render(<ReporteDescargaButtons label="Antigüedad de saldos" onDescargar={onDescargar} />)
    fireEvent.click(screen.getByRole('button', { name: /pdf/i }))
    fireEvent.click(screen.getByRole('button', { name: /excel/i }))
    expect(onDescargar).toHaveBeenNthCalledWith(1, 'pdf')
    expect(onDescargar).toHaveBeenNthCalledWith(2, 'excel')
  })
})
