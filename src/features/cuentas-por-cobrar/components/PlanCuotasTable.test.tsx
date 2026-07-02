import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PlanCuotasTable } from './PlanCuotasTable'
import { authAs } from '@/test/auth'
import type { CuotaDto } from '../types'

const cuotas: CuotaDto[] = [
  { numero: 1, monto: 50, fechaPactada: '2026-07-01', estado: 'Pagada', codigoGeneracion: 'GEN-1', esCuotaFinal: false, interesMora: 0 },
  { numero: 2, monto: 50, fechaPactada: '2026-08-01', estado: 'Pendiente', esCuotaFinal: true, interesMora: 0 },
]

function auth(rolNombre: string) {
  authAs(rolNombre, { accesoTodasSucursales: true })
}

function setup(onPagar = () => {}) {
  return render(<PlanCuotasTable cuotas={cuotas} onPagar={onPagar} />)
}

describe('PlanCuotasTable', () => {
  beforeEach(() => auth('EmisorAdmin'))

  it('renderiza una fila por cuota', () => {
    setup()
    expect(screen.getByText('GEN-1')).toBeInTheDocument()
    expect(screen.getAllByText('$50.00').length).toBe(2)
  })
  it('solo muestra Pagar en cuotas no pagadas y pasa el número', () => {
    const onPagar = vi.fn()
    setup(onPagar)
    const botones = screen.getAllByRole('button', { name: /pagar/i })
    expect(botones.length).toBe(1)
    fireEvent.click(botones[0])
    expect(onPagar).toHaveBeenCalledWith(2)
  })
  it('Cajero ve "Pagar" (rol de escritura de cobro)', () => {
    auth('Cajero')
    setup()
    expect(screen.getByRole('button', { name: /pagar/i })).toBeInTheDocument()
  })
  it('Auditor no ve "Pagar"', () => {
    auth('Auditor')
    setup()
    expect(screen.queryByRole('button', { name: /pagar/i })).toBeNull()
  })
})
