import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KpiCard } from './KpiCard'

describe('KpiCard', () => {
  it('muestra label y valor', () => {
    render(<KpiCard label="Total ventas" valor="$45,000" />)
    expect(screen.getByText('Total ventas')).toBeInTheDocument()
    expect(screen.getByText('$45,000')).toBeInTheDocument()
  })
  it('muestra el delta con signo', () => {
    render(<KpiCard label="Crecimiento" valor="12.5%" delta={12.5} />)
    expect(screen.getByText(/▲.*12\.5/)).toBeInTheDocument()
  })
})
