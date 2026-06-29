import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RefinanciarModal } from './RefinanciarModal'

describe('RefinanciarModal', () => {
  it('no confirma sin motivo aunque las cuotas cuadren', () => {
    const onConfirmar = vi.fn()
    render(<RefinanciarModal saldo={100} onConfirmar={onConfirmar} onClose={() => {}} cargando={false} />)
    fireEvent.click(screen.getByRole('button', { name: /refinanciar/i }))
    expect(onConfirmar).not.toHaveBeenCalled()
    expect(screen.getByText('El motivo es obligatorio.')).toBeInTheDocument()
  })
  it('confirma con motivo y cuotas que cuadran (50+50=100 por defecto)', () => {
    const onConfirmar = vi.fn()
    render(<RefinanciarModal saldo={100} onConfirmar={onConfirmar} onClose={() => {}} cargando={false} />)
    fireEvent.change(screen.getByLabelText(/motivo/i), { target: { value: 'Acuerdo con cliente' } })
    // ajustar las dos cuotas por defecto a 50 y 50
    const valores = screen.getAllByLabelText(/monto|valor/i)
    fireEvent.change(valores[0], { target: { value: '50' } })
    fireEvent.change(valores[1], { target: { value: '50' } })
    const fechas = screen.getAllByLabelText(/fecha/i)
    fireEvent.change(fechas[0], { target: { value: '2026-09-01' } })
    fireEvent.change(fechas[1], { target: { value: '2026-10-01' } })
    fireEvent.click(screen.getByRole('button', { name: /^refinanciar/i }))
    expect(onConfirmar).toHaveBeenCalledWith(expect.objectContaining({ motivo: 'Acuerdo con cliente' }))
  })
})
