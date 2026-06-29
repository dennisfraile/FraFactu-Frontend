import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PlanCuotasTable } from './PlanCuotasTable'
import type { CuotaDto } from '../types'

const cuotas: CuotaDto[] = [
  { numero: 1, monto: 50, fechaPactada: '2026-07-01', estado: 'Pagada', codigoGeneracion: 'GEN-1', esCuotaFinal: false, interesMora: 0 },
  { numero: 2, monto: 50, fechaPactada: '2026-08-01', estado: 'Pendiente', esCuotaFinal: true, interesMora: 0 },
]

describe('PlanCuotasTable', () => {
  it('renderiza una fila por cuota', () => {
    render(<PlanCuotasTable cuotas={cuotas} onPagar={() => {}} />)
    expect(screen.getByText('GEN-1')).toBeInTheDocument()
    expect(screen.getAllByText('$50.00').length).toBe(2)
  })
  it('solo muestra Pagar en cuotas no pagadas y pasa el número', () => {
    const onPagar = vi.fn()
    render(<PlanCuotasTable cuotas={cuotas} onPagar={onPagar} />)
    const botones = screen.getAllByRole('button', { name: /pagar/i })
    expect(botones.length).toBe(1)
    fireEvent.click(botones[0])
    expect(onPagar).toHaveBeenCalledWith(2)
  })
})
