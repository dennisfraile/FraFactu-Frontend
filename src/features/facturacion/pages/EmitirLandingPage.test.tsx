import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { EmitirLandingPage } from './EmitirLandingPage'

describe('EmitirLandingPage', () => {
  it('muestra una tarjeta por cada tipo emisible', () => {
    render(<MemoryRouter><EmitirLandingPage /></MemoryRouter>)
    expect(screen.getByText('Factura Electrónica')).toBeInTheDocument()
  })
})
