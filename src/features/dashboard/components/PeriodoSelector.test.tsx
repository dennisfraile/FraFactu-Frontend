import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PeriodoSelector } from './PeriodoSelector'
import { rangoDePreset, inicioDelDiaISO, finDelDiaISO } from '../date-range'

describe('PeriodoSelector', () => {
  it('al elegir un preset emite el rango correspondiente', () => {
    const onChange = vi.fn()
    const inicial = { preset: '30d' as const, ...rangoDePreset('30d') }
    render(<PeriodoSelector value={inicial} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /^hoy$/i }))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ preset: 'hoy' }))
  })
  it('modo personalizado emite preset custom al cambiar una fecha', () => {
    const onChange = vi.fn()
    const inicial = { preset: '30d' as const, ...rangoDePreset('30d') }
    render(<PeriodoSelector value={inicial} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /personalizado/i }))
    const desde = screen.getByLabelText(/desde/i)
    fireEvent.change(desde, { target: { value: '2026-01-01' } })
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ preset: 'custom' }))
  })
  it('la fecha "Hasta" cubre el día completo (fin al final del día, no al inicio)', () => {
    const onChange = vi.fn()
    const inicial = { preset: 'custom' as const, fechaInicio: inicioDelDiaISO('2026-01-01'), fechaFin: finDelDiaISO('2026-01-01') }
    render(<PeriodoSelector value={inicial} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/hasta/i), { target: { value: '2026-01-31' } })
    const emitido = onChange.mock.calls.at(-1)![0]
    const fin = new Date(emitido.fechaFin)
    expect(fin.getDate()).toBe(31)
    expect(fin.getHours()).toBe(23)
    // el rango completo abarca los 31 días, no colapsa el último
    const dias = (fin.getTime() - new Date(emitido.fechaInicio).getTime()) / 86_400_000
    expect(dias).toBeGreaterThan(30)
  })
  it('no emite un rango invertido y muestra un aviso si "Hasta" < "Desde"', () => {
    const onChange = vi.fn()
    const inicial = { preset: 'custom' as const, fechaInicio: inicioDelDiaISO('2026-06-15'), fechaFin: finDelDiaISO('2026-06-20') }
    render(<PeriodoSelector value={inicial} onChange={onChange} />)
    onChange.mockClear()
    fireEvent.change(screen.getByLabelText(/hasta/i), { target: { value: '2026-06-01' } })
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/no puede ser anterior/i)
  })
})
